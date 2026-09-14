import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { MonoText } from '@/components/ui/MonoText';
import { StateView } from '@/components/ui/StateView';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/format';

export default function ExpensesScreen() {
  const router = useRouter();
  const { activeVehicle } = useVehicle();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const categories = ['all', 'fuel', 'service', 'replacement', 'other'];

  const fetchExpenses = async () => {
    if (!activeVehicle) return;
    try {
      setError(null);
      const url =
        selectedCategory === 'all'
          ? `/vehicles/${activeVehicle.id}/expenses`
          : `/vehicles/${activeVehicle.id}/expenses?category=${selectedCategory}`;
      const data = await apiFetch(url);
      setExpenses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load expenses ledger');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (activeVehicle) {
        setLoading(true);
        fetchExpenses();
      }
    }, [activeVehicle?.id, selectedCategory])
  );

  const totalSum = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'fuel':
        return Colors.success;
      case 'service':
        return Colors.primaryBlue;
      case 'replacement':
        return Colors.warning;
      default:
        return Colors.textDim;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses Ledger</Text>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.7}
          onPress={() => router.push('/expenses/add' as any)}>
          <Text style={styles.addBtnText}>+ Add Other</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Header */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryLabel}>
          TOTAL EXPENSES ({selectedCategory.toUpperCase()}):
        </Text>
        <MonoText size={FontSizes.lg} weight="800" color={Colors.textPrimary}>
          {formatCurrency(totalSum)}
        </MonoText>
      </View>

      {/* Category Chips */}
      <View style={styles.chipRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, selectedCategory === cat && styles.chipActive]}
            activeOpacity={0.7}
            onPress={() => setSelectedCategory(cat)}>
            <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
              {cat.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <StateView
        loading={loading}
        error={error}
        empty={expenses.length === 0}
        emptyTitle="No Expense Records"
        emptyMessage="All fuel, service, replacement, and custom expenses will show up here."
        onRetry={fetchExpenses}
        onAction={() => router.push('/expenses/add' as any)}
        actionTitle="+ Add Custom Expense">
        <FlatList
          data={expenses}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchExpenses();
              }}
              tintColor={Colors.primaryBlue}
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1, marginRight: Spacing.p12 }}>
                  <View style={styles.catBadgeRow}>
                    <View
                      style={[
                        styles.catBadge,
                        { backgroundColor: getCategoryColor(item.category) + '20' },
                      ]}>
                      <Text style={[styles.catBadgeText, { color: getCategoryColor(item.category) }]}>
                        {item.category.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.expense_date)}</Text>
                  </View>
                  <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
                </View>

                <MonoText size={FontSizes.base} weight="800" color={Colors.textPrimary}>
                  {formatCurrency(item.amount)}
                </MonoText>
              </View>
            </Card>
          )}
        />
      </StateView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 50,
    paddingBottom: Spacing.p16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  addBtn: {
    backgroundColor: Colors.primaryBlue,
    paddingHorizontal: Spacing.p16,
    paddingVertical: Spacing.p8,
    borderRadius: Radii.small,
    minHeight: MinTouchTarget,
    justifyContent: 'center',
  },
  addBtnText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: FontSizes.sm,
  },
  summaryBar: {
    backgroundColor: Colors.card,
    padding: Spacing.cardPadding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textDim,
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.p12,
    gap: Spacing.p8,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.small,
    paddingHorizontal: Spacing.p12,
    paddingVertical: Spacing.p8,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.blueDim,
    borderColor: Colors.primaryBlue,
  },
  chipText: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  chipTextActive: {
    color: Colors.textPrimary,
  },
  listContent: {
    padding: Spacing.screenPadding,
    gap: Spacing.p12,
  },
  card: {
    padding: Spacing.cardPadding,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.p8,
    marginBottom: Spacing.p4,
  },
  catBadge: {
    paddingHorizontal: Spacing.p8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  dateText: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
  },
  description: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
