import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DatePickerField } from '@/components/ui/DatePickerField';
import {
  validNonNegativeNumber,
  validDocumentDate,
  getLocalTodayString,
} from '@/utils/dashboardValidation';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/services/api';
import { dataCache } from '@/services/dataCache';

interface AddServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (data: any) => void | Promise<void>;
  currentOdometer?: number;
  vehicleId?: number;
}

const SERVICE_TYPES = [
  'Engine Oil',
  'Oil Filter',
  'Air Filter',
  'Coolant',
  'Brake Pads',
  'General Service',
  'Spark Plug',
  'Battery Check',
  'Wheel Alignment',
  'Transmission Fluid',
  'Chain / Belt Lube',
  'Tyre Rotation',
];

const BackIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke="#1E293B"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CloseIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  visible,
  onClose,
  onSave,
  currentOdometer,
  vehicleId,
}) => {
  const { activeVehicle, reloadVehicles } = useVehicle();
  const targetVehicleId = vehicleId || activeVehicle?.id;

  const [serviceDate, setServiceDate] = useState(getLocalTodayString());
  const [odometer, setOdometer] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [mechanicName, setMechanicName] = useState('');
  const [mechanicPhone, setMechanicPhone] = useState('');
  const [cost, setCost] = useState('');
  const [nextDueOdometer, setNextDueOdometer] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'Engine Oil',
    'General Service',
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const saving = useRef(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Reset and pre-populate fields whenever modal is presented
  useEffect(() => {
    if (visible) {
      const odo =
        currentOdometer !== undefined
          ? currentOdometer
          : activeVehicle?.current_odometer !== undefined
          ? activeVehicle.current_odometer
          : 0;
      setOdometer(odo > 0 ? String(odo) : '');
      setNextDueOdometer(odo > 0 ? String(odo + 3000) : '');
      setServiceDate(getLocalTodayString());
      setSaveError(null);
      setFieldErrors({});
      saving.current = false;
      setLoading(false);
    }
  }, [visible, currentOdometer, activeVehicle?.current_odometer]);

  const toggleService = (type: string) => {
    if (fieldErrors.services) {
      setFieldErrors((prev) => ({ ...prev, services: undefined as any }));
    }
    if (selectedServices.includes(type)) {
      setSelectedServices(selectedServices.filter((s) => s !== type));
    } else {
      setSelectedServices([...selectedServices, type]);
    }
  };

  const handleSave = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    console.log('[AddServiceModal] handleSave button clicked:', {
      targetVehicleId,
      serviceDate,
      odometer,
      cost,
      nextDueOdometer,
      workshopName,
      mechanicName,
      mechanicPhone,
      selectedServices,
      notes,
    });

    if (saving.current) return;
    setSaveError(null);

    // Validation
    const errors: Record<string, string> = {};
    const todayStr = getLocalTodayString();

    if (!serviceDate || !serviceDate.trim()) {
      errors.serviceDate = 'Service date is required.';
    } else if (!validDocumentDate(serviceDate)) {
      errors.serviceDate = 'Service date must be in YYYY-MM-DD format.';
    } else if (serviceDate > todayStr) {
      errors.serviceDate = 'Service date cannot be in the future.';
    }

    const cleanOdo = odometer.trim();
    if (!cleanOdo) {
      errors.odometer = 'Odometer reading is required.';
    } else if (!validNonNegativeNumber(cleanOdo)) {
      errors.odometer = 'Enter a valid non-negative number.';
    }

    const cleanCost = cost.trim();
    if (!cleanCost) {
      errors.cost = 'Total cost is required.';
    } else if (!validNonNegativeNumber(cleanCost)) {
      errors.cost = 'Enter a valid non-negative amount.';
    }

    const cleanNextDue = nextDueOdometer.trim();
    if (cleanNextDue) {
      if (!validNonNegativeNumber(cleanNextDue)) {
        errors.nextDueOdometer = 'Enter a valid number.';
      } else if (Number(cleanNextDue) <= Number(cleanOdo)) {
        errors.nextDueOdometer = 'Next due must be greater than current odometer.';
      }
    }

    if (!selectedServices.length) {
      errors.services = 'Please select at least one service performed.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstMsg = Object.values(errors)[0];
      setSaveError(firstMsg);
      Alert.alert('Validation Error', firstMsg);
      return;
    }

    if (!targetVehicleId) {
      const noVehMsg = 'No vehicle selected. Please select a vehicle first.';
      setSaveError(noVehMsg);
      Alert.alert('Error', noVehMsg);
      return;
    }

    saving.current = true;
    setLoading(true);

    const payload = {
      service_date: serviceDate,
      odometer: Number(cleanOdo),
      workshop_name: workshopName.trim() || undefined,
      workshop: workshopName.trim() || undefined,
      mechanic_name: mechanicName.trim() || undefined,
      mechanic_phone: mechanicPhone.trim() || undefined,
      total_cost: Number(cleanCost),
      cost: Number(cleanCost),
      services_performed: selectedServices,
      services: selectedServices,
      next_service_due_odometer: cleanNextDue ? Number(cleanNextDue) : undefined,
      next_due_km: cleanNextDue ? Number(cleanNextDue) : undefined,
      notes: notes.trim() || undefined,
    };

    try {
      console.log(`[AddServiceModal] POSTing to /vehicles/${targetVehicleId}/services`, payload);
      const createdRecord = await apiFetch<any>(`/vehicles/${targetVehicleId}/services`, {
        method: 'POST',
        body: payload,
      });

      console.log('[AddServiceModal] Save succeeded. Response:', createdRecord);

      // Invalidate caches so Services tab, Expenses ledger, Dashboard, Reminders reload immediately
      dataCache.clear();
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.removeItem('vehiclecare_service_records_list');
          window.localStorage.removeItem('vehiclecare_expenses_list');
        } catch {}
      }

      // Reload vehicles so updated current_odometer is reflected across screens
      try {
        await reloadVehicles(targetVehicleId);
      } catch (reloadErr) {
        console.warn('[AddServiceModal] reloadVehicles warning:', reloadErr);
      }

      // Notify caller / parent component
      if (onSave) {
        try {
          await onSave(createdRecord || payload);
        } catch (onSaveErr) {
          console.warn('[AddServiceModal] onSave callback warning:', onSaveErr);
        }
      }

      Alert.alert('Success', 'Service record logged successfully!');
      onClose();
    } catch (err: any) {
      console.error('[AddServiceModal] Save failed:', err);
      const serverMsg =
        err?.message ||
        (err?.errors ? Object.values(err.errors).flat().join(' ') : 'Failed to save service record.');
      setSaveError(serverMsg);
      Alert.alert('Save Failed', serverMsg);
    } finally {
      saving.current = false;
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityLabel="Go back"
                accessibilityRole="button">
                <BackIcon />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Add Service Record</Text>
                <Text style={styles.subtitle}>Log maintenance, parts, and oil changes</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityLabel="Close"
              accessibilityRole="button">
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {saveError ? (
              <View style={styles.errorBanner}>
                <Text accessibilityRole="alert" style={styles.errorBannerText}>
                  {saveError}
                </Text>
              </View>
            ) : null}

            {/* Service Date & Odometer Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Service Date</Text>
                <DatePickerField
                  value={serviceDate}
                  onChangeText={(val) => {
                    setServiceDate(val);
                    if (fieldErrors.serviceDate) {
                      setFieldErrors((prev) => ({ ...prev, serviceDate: undefined as any }));
                    }
                  }}
                />
                {fieldErrors.serviceDate ? (
                  <Text style={styles.fieldErrorText}>{fieldErrors.serviceDate}</Text>
                ) : null}
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Odometer (KM) *</Text>
                <TextInput
                  style={[styles.input, fieldErrors.odometer ? styles.inputError : undefined]}
                  value={odometer}
                  onChangeText={(val) => {
                    setOdometer(val);
                    if (fieldErrors.odometer) {
                      setFieldErrors((prev) => ({ ...prev, odometer: undefined as any }));
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="e.g. 5000"
                />
                {fieldErrors.odometer ? (
                  <Text style={styles.fieldErrorText}>{fieldErrors.odometer}</Text>
                ) : null}
              </View>
            </View>

            {/* Total Cost & Next Due Odometer */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Total Cost (LKR) *</Text>
                <TextInput
                  style={[styles.input, fieldErrors.cost ? styles.inputError : undefined]}
                  value={cost}
                  onChangeText={(val) => {
                    setCost(val);
                    if (fieldErrors.cost) {
                      setFieldErrors((prev) => ({ ...prev, cost: undefined as any }));
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="e.g. 1850"
                />
                {fieldErrors.cost ? (
                  <Text style={styles.fieldErrorText}>{fieldErrors.cost}</Text>
                ) : null}
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Next Due (KM)</Text>
                <TextInput
                  style={[styles.input, fieldErrors.nextDueOdometer ? styles.inputError : undefined]}
                  value={nextDueOdometer}
                  onChangeText={(val) => {
                    setNextDueOdometer(val);
                    if (fieldErrors.nextDueOdometer) {
                      setFieldErrors((prev) => ({ ...prev, nextDueOdometer: undefined as any }));
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="e.g. 8000"
                />
                {fieldErrors.nextDueOdometer ? (
                  <Text style={styles.fieldErrorText}>{fieldErrors.nextDueOdometer}</Text>
                ) : null}
              </View>
            </View>

            {/* Workshop & Mechanic Details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Garage & Mechanic Details</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Workshop / Garage Name</Text>
                <TextInput
                  style={styles.input}
                  value={workshopName}
                  onChangeText={setWorkshopName}
                  placeholder="e.g. Authorized Service Center"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8, marginBottom: 0 }]}>
                  <Text style={styles.label}>Mechanic Name</Text>
                  <TextInput
                    style={styles.input}
                    value={mechanicName}
                    onChangeText={setMechanicName}
                    placeholder="e.g. Kamal Perera"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8, marginBottom: 0 }]}>
                  <Text style={styles.label}>Mechanic Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={mechanicPhone}
                    onChangeText={setMechanicPhone}
                    keyboardType="phone-pad"
                    placeholder="e.g. 077 123 4567"
                  />
                </View>
              </View>
            </View>

            {/* Service Items Grid */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Select Services Performed *</Text>
              {fieldErrors.services ? (
                <Text style={[styles.fieldErrorText, { marginBottom: 8 }]}>
                  {fieldErrors.services}
                </Text>
              ) : null}
              <View style={styles.grid}>
                {SERVICE_TYPES.map((type) => {
                  const selected = selectedServices.includes(type);
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.servicePill, selected && styles.servicePillActive]}
                      onPress={() => toggleService(type)}
                      activeOpacity={0.75}>
                      <Text style={[styles.serviceText, selected && styles.serviceTextActive]}>
                        {selected ? '✓ ' : '+ '}
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Parts replaced, recommendations, oil grade..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}>
              {loading ? (
                <View style={styles.btnLoadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={[styles.saveBtnText, { marginLeft: 8 }]}>Saving Record...</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>Save Service Record</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    gap: 14,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
  },
  fieldErrorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  textArea: {
    height: 76,
    paddingTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  servicePillActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  serviceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  serviceTextActive: {
    color: '#1D4ED8',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveBtn: {
    height: 50,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
