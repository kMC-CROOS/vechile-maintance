import { validateServiceEntry, validNonNegativeNumber, validDocumentDate } from '@/utils/dashboardValidation';
import React, { useState, useRef } from 'react';
import {
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

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (data: any) => void | Promise<void>;
}

const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'NetBanking', 'Other'] as const;

const EXPENSE_CATEGORIES = [
  'Fuel',
  'Service',
  'Repair',
  'Parking',
  'Toll',
  'Insurance',
  'Washing',
  'Accessories',
  'Fines',
  'Tax',
  'Loan EMI',
  'Other',
] as const;

const CloseIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [expenseDate, setExpenseDate] = useState(today);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [category, setCategory] = useState<string>('Fuel');
  const [loading, setLoading] = useState(false);
  const saving = useRef(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (saving.current) return;
    setSaveError(null);
    if (!validNonNegativeNumber(amount) || Number(amount) <= 0) { setSaveError('Enter an amount greater than zero.'); return; }
    if (!validDocumentDate(expenseDate) || expenseDate > today) { setSaveError('Choose a valid expense date that is not in the future.'); return; }
    if (!description.trim() || description.trim().length > 190) { setSaveError('Enter a description of 1 to 190 characters.'); return; }
    saving.current = true;
    setLoading(true);
    const expenseData = {
      expenseDate,
      amount: Number(amount),
      description: description.trim(),
      paymentMethod,
      category,
    };

    try {
      if (!onSave) throw new Error('Saving is unavailable. Please reopen this form.');
      if (onSave) {
        await onSave(expenseData);
      }
      Alert.alert('Success', 'Expense logged successfully!');
      onClose();
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save expense');
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
            <View>
              <Text style={styles.title}>Add Expense</Text>
              <Text style={styles.subtitle}>Track your maintenance and operational costs</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {saveError ? <Text accessibilityRole="alert" style={{ color: '#B91C1C', marginBottom: 12 }}>{saveError}</Text> : null}
            {/* Amount & Date */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                <Text style={styles.label}>Amount (₹) *</Text>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Date</Text>
                <DatePickerField value={expenseDate} onChangeText={setExpenseDate} />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Petrol refill, Toll gate, Car wash"
              />
            </View>

            {/* Expense Category Pills */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Expense Category</Text>
              <View style={styles.pillsWrap}>
                {EXPENSE_CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.75}>
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Payment Method Pills */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment Method</Text>
              <View style={styles.pillsWrap}>
                {PAYMENT_METHODS.map((method) => {
                  const active = paymentMethod === method;
                  return (
                    <TouchableOpacity
                      key={method}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => setPaymentMethod(method)}
                      activeOpacity={0.75}>
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>
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
              <Text style={styles.saveBtnText}>
                {loading ? 'Saving Expense...' : 'Save Expense'}
              </Text>
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
  amountInput: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  dateWrapper: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#0F172A',
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
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
});
