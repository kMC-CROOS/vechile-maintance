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
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/services/api';

const SERVICE_CHIPS = [
  { id: 'engine_oil', label: 'Engine Oil' },
  { id: 'oil_filter', label: 'Oil Filter' },
  { id: 'air_filter', label: 'Air Filter' },
  { id: 'coolant', label: 'Coolant' },
  { id: 'brake_pads', label: 'Brake Pads' },
  { id: 'brake_oil', label: 'Brake Oil' },
  { id: 'clutch', label: 'Clutch Service' },
  { id: 'battery', label: 'Battery Check' },
  { id: 'spark_plug', label: 'Spark Plugs' },
  { id: 'wheel_alignment', label: 'Wheel Alignment' },
  { id: 'general_service', label: 'General Service' },
  { id: 'other', label: 'Other' },
];

export default function AddServiceScreen() {
  const router = useRouter();
  const { activeVehicle, reloadVehicles } = useVehicle();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState(activeVehicle ? String(activeVehicle.current_odometer) : '');
  const [workshopName, setWorkshopName] = useState('');
  const [mechanicName, setMechanicName] = useState('');
  const [mechanicPhone, setMechanicPhone] = useState('');
  const [totalCost, setTotalCost] = useState('');

  // Step 2
  const [selectedChips, setSelectedChips] = useState<string[]>(['general_service']);
  const [nextOdometer, setNextOdometer] = useState('');
  const [notes, setNotes] = useState('');

  const toggleChip = (id: string) => {
    if (selectedChips.includes(id)) {
      setSelectedChips(selectedChips.filter((c) => c !== id));
    } else {
      setSelectedChips([...selectedChips, id]);
    }
  };

  const validateStep1 = () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!serviceDate) newErrors.service_date = 'Service date is required';
    if (!odometer || isNaN(Number(odometer))) newErrors.odometer = 'Valid odometer reading is required';
    if (!totalCost || isNaN(Number(totalCost))) newErrors.total_cost = 'Valid total cost is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleNextStep = (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (validateStep1()) {
      // Auto suggest next service due odometer (+5000 km)
      if (!nextOdometer && odometer) {
        setNextOdometer(String(Number(odometer) + 5000));
      }
      setStep(2);
    }
  };

  const handleSave = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!activeVehicle) return;

    setLoading(true);
    try {
      await apiFetch(`/vehicles/${activeVehicle.id}/services`, {
        method: 'POST',
        body: {
          service_date: serviceDate,
          odometer: Number(odometer),
          workshop_name: workshopName.trim() || undefined,
          mechanic_name: mechanicName.trim() || undefined,
          mechanic_phone: mechanicPhone.trim() || undefined,
          total_cost: Number(totalCost),
          services_performed: selectedChips,
          next_service_due_odometer: nextOdometer ? Number(nextOdometer) : undefined,
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
        Alert.alert('Error', err.message || 'Failed to save service record');
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
        {/* Header */}
        <View style={styles.stepHeader}>
          <TouchableOpacity
            style={styles.backTouch}
            activeOpacity={0.7}
            onPress={() => (step === 2 ? setStep(1) : router.back())}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Service ({step}/2)</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: step === 1 ? '50%' : '100%' }]} />
        </View>

        {step === 1 ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Step 1: Service Details</Text>

            <Input
              label="Service Date (YYYY-MM-DD)"
              placeholder="2026-09-11"
              value={serviceDate}
              onChangeText={setServiceDate}
              isMono
              error={errors.service_date}
            />

            <Input
              label="Odometer at Service (KM)"
              placeholder="e.g. 45000"
              value={odometer}
              onChangeText={setOdometer}
              keyboardType="numeric"
              isMono
              error={errors.odometer}
            />

            <Input
              label="Total Cost (LKR)"
              placeholder="e.g. 15000"
              value={totalCost}
              onChangeText={setTotalCost}
              keyboardType="numeric"
              isMono
              error={errors.total_cost}
            />

            <Input
              label="Workshop / Service Center Name"
              placeholder="e.g. Toyota Lanka / Local Mechanic"
              value={workshopName}
              onChangeText={setWorkshopName}
              error={errors.workshop_name}
            />

            <Input
              label="Mechanic Name (Optional)"
              placeholder="e.g. Saman"
              value={mechanicName}
              onChangeText={setMechanicName}
            />

            <Input
              label="Mechanic Contact Phone (Optional)"
              placeholder="+94 77 123 4567"
              value={mechanicPhone}
              onChangeText={setMechanicPhone}
              keyboardType="phone-pad"
            />

            <Button title="Continue to Services Performed →" onPress={handleNextStep} style={{ marginTop: Spacing.p12 }} />
          </Card>
        ) : (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Step 2: Services Performed & Forecast</Text>

            <Text style={styles.label}>Select Services Performed</Text>
            <View style={styles.chipGrid}>
              {SERVICE_CHIPS.map((chip) => {
                const selected = selectedChips.includes(chip.id);
                return (
                  <TouchableOpacity
                    key={chip.id}
                    style={[styles.chip, selected && styles.chipActive]}
                    activeOpacity={0.7}
                    onPress={() => toggleChip(chip.id)}>
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {selected ? '✓ ' : ''}{chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Next Service Due Odometer (KM)"
              placeholder="e.g. 50000"
              value={nextOdometer}
              onChangeText={setNextOdometer}
              keyboardType="numeric"
              isMono
              error={errors.next_service_due_odometer}
            />

            <Input
              label="Additional Notes / Remarks"
              placeholder="e.g. Replaced synthetic 5W-30 oil"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <Button title="Save Service Record" onPress={handleSave} loading={loading} style={{ marginTop: Spacing.p16 }} />
          </Card>
        )}
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
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.p16,
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
    fontSize: FontSizes.base,
    fontWeight: '700',
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.surface2,
    borderRadius: 2,
    marginBottom: Spacing.p20,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.primaryBlue,
    borderRadius: 2,
  },
  card: {
    padding: Spacing.p20,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.p16,
  },
  label: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing.p8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.p8,
    marginBottom: Spacing.p20,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.small,
    paddingHorizontal: Spacing.p12,
    paddingVertical: Spacing.p8,
    minHeight: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.blueDim,
    borderColor: Colors.primaryBlue,
  },
  chipText: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
  },
  chipTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});
