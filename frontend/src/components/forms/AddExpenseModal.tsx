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

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (data: any) => void | Promise<void>;
  vehicleId?: number;
}

const PAYMENT_METHODS = ['Cash', 'Card', 'LankaQR', 'Bank Transfer', 'Other'] as const;

const EXPENSE_CATEGORIES = [
  'Fuel',
  'Service',
  'Repair',
  'Parking',
  'Expressway Toll',
  'Insurance',
  'Vehicle Wash',
  'Accessories',
  'Traffic Fine',
  'Revenue Licence',
  'Leasing / Loan',
  'Other',
] as const;

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

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  onSave,
  vehicleId,
}) => {
  const { activeVehicle, reloadVehicles } = useVehicle();
  const targetVehicleId = vehicleId || activeVehicle?.id;

  const [expenseDate, setExpenseDate] = useState(getLocalTodayString());
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [category, setCategory] = useState<string>('Fuel');
  const [loading, setLoading] = useState(false);
  const saving = useRef(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setExpenseDate(getLocalTodayString());
      setAmount('');
      setDescription('');
      setCategory('Fuel');
      setPaymentMethod('Cash');
      setSaveError(null);
      setFieldErrors({});
      saving.current = false;
      setLoading(false);
    }
  }, [visible]);

  const handleSave = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    console.log('[AddExpenseModal] handleSave invoked', {
      targetVehicleId,
      amount,
      expenseDate,
      description,
      category,
      paymentMethod,
    });

    if (saving.current) return;
    setSaveError(null);

    const errors: Record<string, string> = {};
    const todayStr = getLocalTodayString();

    const cleanAmount = amount.trim();
    if (!cleanAmount) {
      errors.amount = 'Amount is required.';
    } else if (!validNonNegativeNumber(cleanAmount) || Number(cleanAmount) <= 0) {
      errors.amount = 'Enter an amount greater than zero.';
    }

    if (!expenseDate || !expenseDate.trim()) {
      errors.expenseDate = 'Expense date is required.';
    } else if (!validDocumentDate(expenseDate)) {
      errors.expenseDate = 'Date must be in YYYY-MM-DD format.';
    } else if (expenseDate > todayStr) {
      errors.expenseDate = 'Expense date cannot be in the future.';
    }

    const cleanDesc = description.trim();
    if (!cleanDesc) {
      errors.description = 'Description is required.';
    } else if (cleanDesc.length > 255) {
      errors.description = 'Description cannot exceed 255 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstMsg = Object.values(errors)[0];
      setSaveError(firstMsg);
      Alert.alert('Validation Error', firstMsg);
      return;
    }

    if (!targetVehicleId) {
      const msg = 'No vehicle selected. Please select a vehicle first.';
      setSaveError(msg);
      Alert.alert('Error', msg);
      return;
    }

    saving.current = true;
    setLoading(true);

    const payload = {
      category: category.toLowerCase(),
      expense_date: expenseDate,
      description: cleanDesc,
      amount: Number(cleanAmount),
    };

    try {
      console.log(`[AddExpenseModal] POSTing to /vehicles/${targetVehicleId}/expenses:`, payload);
      const createdExpense = await apiFetch<any>(`/vehicles/${targetVehicleId}/expenses`, {
        method: 'POST',
        body: payload,
      });
      console.log('[AddExpenseModal] Successfully created expense:', createdExpense);

      // Invalidate cache and web localStorage
      dataCache.clear();
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.removeItem('vehiclecare_expenses_list');
        } catch {}
      }

      // Reload vehicles in context so financial analytics and summaries update
      try {
        await reloadVehicles(targetVehicleId);
      } catch (reloadErr) {
        console.warn('[AddExpenseModal] reloadVehicles warning:', reloadErr);
      }

      // Notify caller
      if (onSave) {
        try {
          await onSave(createdExpense || payload);
        } catch (onSaveErr) {
          console.warn('[AddExpenseModal] onSave callback warning:', onSaveErr);
        }
      }

      // Close modal immediately (reliable on both mobile and web)
      onClose();
      Alert.alert('Success', 'Expense logged successfully!');
    } catch (err: any) {
      console.error('[AddExpenseModal] Error saving expense:', err);
      const serverMsg =
        err?.message ||
        (err?.errors ? Object.values(err.errors).flat().join(' ') : 'Failed to save expense.');
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
                <Text style={styles.title}>Add Expense</Text>
                <Text style={styles.subtitle}>Track your maintenance and operational costs</Text>
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

            {/* Amount & Date */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                <Text style={styles.label}>Amount (LKR) *</Text>
                <TextInput
                  style={[styles.input, styles.amountInput, fieldErrors.amount ? styles.inputError : undefined]}
                  value={amount}
                  onChangeText={(val) => {
                    setAmount(val);
                    if (fieldErrors.amount) setFieldErrors((prev) => ({ ...prev, amount: undefined as any }));
                  }}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
                {fieldErrors.amount ? (
                  <Text style={styles.fieldErrorText}>{fieldErrors.amount}</Text>
                ) : null}
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Date *</Text>
                <DatePickerField
                  value={expenseDate}
                  onChangeText={(val) => {
                    setExpenseDate(val);
                    if (fieldErrors.expenseDate) setFieldErrors((prev) => ({ ...prev, expenseDate: undefined as any }));
                  }}
                />
                {fieldErrors.expenseDate ? (
                  <Text style={styles.fieldErrorText}>{fieldErrors.expenseDate}</Text>
                ) : null}
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, fieldErrors.description ? styles.inputError : undefined]}
                value={description}
                onChangeText={(val) => {
                  setDescription(val);
                  if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: undefined as any }));
                }}
                placeholder="e.g. Petrol refill, Toll gate, Car wash"
              />
              {fieldErrors.description ? (
                <Text style={styles.fieldErrorText}>{fieldErrors.description}</Text>
              ) : null}
            </View>

            {/* Category */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Expense Category</Text>
              <View style={styles.grid}>
                {EXPENSE_CATEGORIES.map((cat) => {
                  const selected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.pill, selected && styles.pillActive]}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.75}>
                      <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Payment Method */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment Method</Text>
              <View style={styles.grid}>
                {PAYMENT_METHODS.map((method) => {
                  const selected = paymentMethod === method;
                  return (
                    <TouchableOpacity
                      key={method}
                      style={[styles.pill, selected && styles.pillActive]}
                      onPress={() => setPaymentMethod(method)}
                      activeOpacity={0.75}>
                      <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                        {method}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
                  <Text style={[styles.saveBtnText, { marginLeft: 8 }]}>Saving Expense...</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>Save Expense</Text>
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
  amountInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: '#FFFFFF',
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
