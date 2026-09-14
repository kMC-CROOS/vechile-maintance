import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { MonoText } from '@/components/ui/MonoText';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/services/api';
import { formatCurrency } from '@/utils/format';
import { DatePickerField } from '@/components/ui/DatePickerField';

export default function AddFuelScreen() {
  const router = useRouter();
  const { activeVehicle, reloadVehicles } = useVehicle();

  const [fuelDate, setFuelDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantityLitres, setQuantityLitres] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [odometer, setOdometer] = useState(activeVehicle ? String(activeVehicle.current_odometer) : '');
  const [fuelStation, setFuelStation] = useState('');
  const [fillType, setFillType] = useState<'full' | 'partial'>('full');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Live calculated total
  const litresNum = Number(quantityLitres) || 0;
  const priceNum = Number(pricePerUnit) || 0;
  const liveTotal = litresNum * priceNum;

  const handleSave = async () => {
    if (!activeVehicle) return;
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!fuelDate) newErrors.fuel_date = 'Fuel date is required';
    if (!quantityLitres || litresNum <= 0) newErrors.quantity_litres = 'Valid quantity in litres is required';
    if (!pricePerUnit || priceNum <= 0) newErrors.price_per_unit = 'Valid price per unit is required';
    if (!odometer || isNaN(Number(odometer))) newErrors.odometer = 'Valid odometer reading is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await apiFetch(`/vehicles/${activeVehicle.id}/fuel`, {
        method: 'POST',
        body: {
          fuel_date: fuelDate,
          quantity_litres: litresNum,
          price_per_unit: priceNum,
          odometer: Number(odometer),
          fuel_station: fuelStation.trim() || undefined,
          fill_type: fillType,
          notes: notes.trim() || undefined,
        },
      });

      await reloadVehicles(activeVehicle.id);
      router.back();
    } catch (err: any) {
      if (err.errors) {
        const formatted: Record<string, string> = {};
        Object.keys(err.errors).forEach((key) => {
          formatted[key] = err.errors[key][0];
        });
        setErrors(formatted);
      } else {
        Alert.alert('Error', err.message || 'Failed to log fuel entry');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backTouch} activeOpacity={0.7} onPress={() => router.back()}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Fuel Entry</Text>
          <View style={{ width: 44 }} />
        </View>

        <Card style={styles.card}>
          <DatePickerField
            label="Fueling Date (YYYY-MM-DD)"
            placeholder="2026-09-11"
            value={fuelDate}
            onChangeText={setFuelDate}
            error={errors.fuel_date}
          />

          <View style={styles.rowGrid}>
            <View style={{ flex: 1 }}>
              <Input
                label="Quantity (Litres)"
                placeholder="e.g. 35.5"
                value={quantityLitres}
                onChangeText={setQuantityLitres}
                keyboardType="numeric"
                isMono
                error={errors.quantity_litres}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Input
                label="Price Per Litre (LKR)"
                placeholder="e.g. 370"
                value={pricePerUnit}
                onChangeText={setPricePerUnit}
                keyboardType="numeric"
                isMono
                error={errors.price_per_unit}
              />
            </View>
          </View>

          {/* LIVE CALCULATED TOTAL BANNER */}
          <View style={styles.totalBanner}>
            <Text style={styles.totalBannerLabel}>LIVE CALCULATED TOTAL</Text>
            <MonoText size={FontSizes.xl} weight="800" color={Colors.success}>
              {formatCurrency(liveTotal)}
            </MonoText>
          </View>

          <Input
            label="Current Odometer (KM)"
            placeholder="e.g. 45200"
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
            isMono
            error={errors.odometer}
          />

          <Input
            label="Fuel Station Name (Optional)"
            placeholder="e.g. CEYPETCO / Lanka IOC"
            value={fuelStation}
            onChangeText={setFuelStation}
          />

          <Text style={styles.label}>Fill Type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, fillType === 'full' && styles.toggleActive]}
              activeOpacity={0.7}
              onPress={() => setFillType('full')}>
              <Text style={[styles.toggleText, fillType === 'full' && styles.toggleTextActive]}>
                Full Tank
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, fillType === 'partial' && styles.toggleActive]}
              activeOpacity={0.7}
              onPress={() => setFillType('partial')}>
              <Text style={[styles.toggleText, fillType === 'partial' && styles.toggleTextActive]}>
                Partial Fill
              </Text>
            </TouchableOpacity>
          </View>

          <Input
            label="Notes (Optional)"
            placeholder="e.g. 95 Octane petrol"
            value={notes}
            onChangeText={setNotes}
          />

          <Button title="Save Fuel Log" onPress={handleSave} loading={loading} style={{ marginTop: Spacing.p16 }} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.p20,
    paddingTop: Spacing.p12,
  },
  backTouch: {
    minHeight: MinTouchTarget,
    justifyContent: 'center',
  },
  backLink: {
    color: Colors.primaryBlue,
    fontSize: FontSizes.base,
    fontWeight: '600',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  card: {
    padding: Spacing.p20,
  },
  rowGrid: {
    flexDirection: 'row',
    gap: Spacing.p12,
  },
  totalBanner: {
    backgroundColor: '#10382D',
    borderColor: Colors.success,
    borderWidth: 1,
    borderRadius: Radii.small,
    padding: Spacing.p16,
    alignItems: 'center',
    marginBottom: Spacing.p16,
  },
  totalBannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
    letterSpacing: 0.5,
    marginBottom: Spacing.p4,
  },
  label: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing.p8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.p12,
    marginBottom: Spacing.p16,
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.small,
    minHeight: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.blueDim,
    borderColor: Colors.primaryBlue,
  },
  toggleText: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
  },
  toggleTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
});
