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

export default function AddExpenseScreen() {
  const router = useRouter();
  const { activeVehicle, reloadVehicles } = useVehicle();

  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    if (!activeVehicle) return;
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!expenseDate) newErrors.expense_date = 'Date is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await apiFetch(`/vehicles/${activeVehicle.id}/expenses`, {
        method: 'POST',
        body: {
          category: 'other',
          expense_date: expenseDate,
          description: description.trim(),
          amount: Number(amount),
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
        Alert.alert('Error', err.message || 'Failed to save expense');
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
          <Text style={styles.headerTitle}>Add Custom Expense</Text>
          <View style={{ width: 44 }} />
        </View>

        <Card style={styles.card}>
          <Text style={styles.infoText}>
            Note: Fuel, service, and replacement expenses are logged automatically via their respective forms. Use this form for custom/other vehicle expenses like toll fees, parking, washing, or fines.
          </Text>

          <Input
            label="Expense Date (YYYY-MM-DD)"
            placeholder="2026-09-11"
            value={expenseDate}
            onChangeText={setExpenseDate}
            isMono
            error={errors.expense_date}
          />

          <Input
            label="Description"
            placeholder="e.g. Expressway Toll Fee, Full Body Car Wash"
            value={description}
            onChangeText={setDescription}
            error={errors.description}
          />

          <Input
            label="Amount (LKR)"
            placeholder="e.g. 1500"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            isMono
            error={errors.amount}
          />

          <Button title="Save Expense" onPress={handleSave} loading={loading} style={{ marginTop: Spacing.p16 }} />
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
  infoText: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
    backgroundColor: Colors.surface,
    padding: Spacing.p12,
    borderRadius: Radii.small,
    marginBottom: Spacing.p16,
    lineHeight: 18,
  },
});
