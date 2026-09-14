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

export default function AddReplacementScreen() {
  const router = useRouter();
  const { activeVehicle, reloadVehicles } = useVehicle();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1: Identity & Cost
  const [type, setType] = useState('tyre');
  const [componentName, setComponentName] = useState('');
  const [replacementDate, setReplacementDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState(activeVehicle ? String(activeVehicle.current_odometer) : '');
  const [partCost, setPartCost] = useState('');
  const [labourCost, setLabourCost] = useState('');
  const [workshopName, setWorkshopName] = useState('');

  // Step 2: Warranty & Forecast
  const [hasWarranty, setHasWarranty] = useState(false);
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState('');
  const [expectedNextKm, setExpectedNextKm] = useState('');
  const [expectedNextDate, setExpectedNextDate] = useState('');

  const replacementTypes = [
    { label: 'Tyre', value: 'tyre' },
    { label: 'Battery', value: 'battery' },
    { label: 'Brakes', value: 'brakes' },
    { label: 'Other Component', value: 'other' },
  ];

  const liveTotal = (Number(partCost) || 0) + (Number(labourCost) || 0);

  const validateStep1 = () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!componentName.trim()) newErrors.component_name = 'Component name is required (e.g. Front Brake Pads)';
    if (!replacementDate) newErrors.replacement_date = 'Date is required';
    if (!odometer || isNaN(Number(odometer))) newErrors.odometer = 'Valid odometer reading is required';
    if (!partCost || isNaN(Number(partCost))) newErrors.part_cost = 'Valid part cost is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSave = async () => {
    if (!activeVehicle) return;

    setLoading(true);
    try {
      await apiFetch(`/vehicles/${activeVehicle.id}/replacements`, {
        method: 'POST',
        body: {
          type,
          component_name: componentName.trim(),
          replacement_date: replacementDate,
          odometer: Number(odometer),
          part_cost: Number(partCost),
          labour_cost: labourCost ? Number(labourCost) : 0,
          workshop_name: workshopName.trim() || undefined,
          has_warranty: hasWarranty,
          warranty_expiry_date: hasWarranty && warrantyExpiryDate ? warrantyExpiryDate : undefined,
          expected_next_km: expectedNextKm ? Number(expectedNextKm) : undefined,
          expected_next_date: expectedNextDate ? expectedNextDate : undefined,
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
        Alert.alert('Error', err.message || 'Failed to save replacement entry');
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
        <View style={styles.stepHeader}>
          <TouchableOpacity
            style={styles.backTouch}
            activeOpacity={0.7}
            onPress={() => (step === 2 ? setStep(1) : router.back())}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Replacement ({step}/2)</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: step === 1 ? '50%' : '100%' }]} />
        </View>

        {step === 1 ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Step 1: Component & Cost</Text>

            <Text style={styles.label}>Category</Text>
            <View style={styles.chipGrid}>
              {replacementTypes.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.chip, type === t.value && styles.chipActive]}
                  activeOpacity={0.7}
                  onPress={() => setType(t.value)}>
                  <Text style={[styles.chipText, type === t.value && styles.chipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Component Name"
              placeholder="e.g. Michelin 205/55R16 Tyre, Yuasa 12V Battery"
              value={componentName}
              onChangeText={setComponentName}
              error={errors.component_name}
            />

            <Input
              label="Replacement Date (YYYY-MM-DD)"
              placeholder="2026-09-11"
              value={replacementDate}
              onChangeText={setReplacementDate}
              isMono
              error={errors.replacement_date}
            />

            <Input
              label="Current Odometer (KM)"
              placeholder="e.g. 45000"
              value={odometer}
              onChangeText={setOdometer}
              keyboardType="numeric"
              isMono
              error={errors.odometer}
            />

            <View style={styles.rowGrid}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Part Cost (LKR)"
                  placeholder="e.g. 25000"
                  value={partCost}
                  onChangeText={setPartCost}
                  keyboardType="numeric"
                  isMono
                  error={errors.part_cost}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Labour Cost (LKR)"
                  placeholder="e.g. 2000"
                  value={labourCost}
                  onChangeText={setLabourCost}
                  keyboardType="numeric"
                  isMono
                />
              </View>
            </View>

            <View style={styles.totalBanner}>
              <Text style={styles.totalBannerLabel}>AUTO-CALCULATED TOTAL COST</Text>
              <MonoText size={FontSizes.xl} weight="800" color={Colors.warning}>
                {formatCurrency(liveTotal)}
              </MonoText>
            </View>

            <Input
              label="Workshop / Supplier Name"
              placeholder="e.g. Tyre House / Local Garage"
              value={workshopName}
              onChangeText={setWorkshopName}
            />

            <Button title="Continue to Warranty & Forecast →" onPress={handleNextStep} style={{ marginTop: Spacing.p12 }} />
          </Card>
        ) : (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Step 2: Warranty & Forecast</Text>

            <TouchableOpacity
              style={styles.warrantyToggle}
              activeOpacity={0.7}
              onPress={() => setHasWarranty(!hasWarranty)}>
              <View style={[styles.checkbox, hasWarranty && styles.checkboxChecked]}>
                {hasWarranty && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.warrantyText}>This part has a manufacturer / shop warranty</Text>
            </TouchableOpacity>

            {hasWarranty && (
              <Input
                label="Warranty Expiry Date (YYYY-MM-DD)"
                placeholder="2027-09-11"
                value={warrantyExpiryDate}
                onChangeText={setWarrantyExpiryDate}
                isMono
              />
            )}

            <Text style={styles.groupHeader}>Next Replacement Forecast (Optional)</Text>
            <Input
              label="Expected Next Replacement Odometer (KM)"
              placeholder="e.g. 95000"
              value={expectedNextKm}
              onChangeText={setExpectedNextKm}
              keyboardType="numeric"
              isMono
            />

            <Input
              label="Expected Next Replacement Date (YYYY-MM-DD)"
              placeholder="2028-09-11"
              value={expectedNextDate}
              onChangeText={setExpectedNextDate}
              isMono
            />

            <Button title="Save Replacement Entry" onPress={handleSave} loading={loading} style={{ marginTop: Spacing.p16 }} />
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
    marginBottom: Spacing.p16,
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
  rowGrid: {
    flexDirection: 'row',
    gap: Spacing.p12,
  },
  totalBanner: {
    backgroundColor: '#3D2A14',
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: Radii.small,
    padding: Spacing.p12,
    alignItems: 'center',
    marginBottom: Spacing.p16,
  },
  totalBannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.warning,
    letterSpacing: 0.5,
    marginBottom: Spacing.p4,
  },
  warrantyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.p12,
    minHeight: MinTouchTarget,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.p12,
    backgroundColor: Colors.surface,
  },
  checkboxChecked: {
    backgroundColor: Colors.primaryBlue,
    borderColor: Colors.primaryBlue,
  },
  checkmark: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
  },
  warrantyText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  groupHeader: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.primaryBlue,
    marginTop: Spacing.p16,
    marginBottom: Spacing.p8,
  },
});
