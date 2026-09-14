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
import { Input } from '@/components/ui/Input';
import { MonoText } from '@/components/ui/MonoText';
import { StateView } from '@/components/ui/StateView';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/services/api';
import { formatCurrency, formatDate, formatOdometer } from '@/utils/format';

export default function ReplacementsScreen() {
  const router = useRouter();
  const { activeVehicle } = useVehicle();

  const [replacements, setReplacements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = ['all', 'tyre', 'battery', 'brakes', 'other'];

  const fetchReplacements = async () => {
    if (!activeVehicle) return;
    try {
      setError(null);
      const data = await apiFetch(`/vehicles/${activeVehicle.id}/replacements`);
      setReplacements(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load replacement records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (activeVehicle) {
        setLoading(true);
        fetchReplacements();
      }
    }, [activeVehicle?.id])
  );

  const filtered = replacements.filter((item) => {
    const matchesCategory = categoryFilter === 'all' || item.type === categoryFilter;
    const matchesSearch =
      (item.component_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.workshop_name || '').toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backTouch} activeOpacity={0.7} onPress={() => router.back()}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Part Replacements</Text>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.7}
          onPress={() => router.push('/replacements/add' as any)}>
          <Text style={styles.addBtnText}>+ Log</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <Input
          placeholder="Search component or workshop..."
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: Spacing.p8 }}
        />

        <View style={styles.chipGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, categoryFilter === cat && styles.chipActive]}
              activeOpacity={0.7}
              onPress={() => setCategoryFilter(cat)}>
              <Text style={[styles.chipText, categoryFilter === cat && styles.chipTextActive]}>
                {cat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <StateView
        loading={loading}
        error={error}
        empty={filtered.length === 0}
        emptyTitle="No Replacements Logged"
        emptyMessage="Track component replacements like tyres, batteries, and brakes here."
        onRetry={fetchReplacements}
        onAction={() => router.push('/replacements/add' as any)}
        actionTitle="+ Log Replacement">
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchReplacements();
              }}
              tintColor={Colors.primaryBlue}
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: Spacing.p12 }}>
                  <Text style={styles.componentName} numberOfLines={1}>{item.component_name}</Text>
                  <Text style={styles.subText} numberOfLines={1}>
                    {item.type.toUpperCase()} • {item.workshop_name || 'Workshop'}
                  </Text>
                </View>
                <MonoText size={FontSizes.base} weight="800" color={Colors.warning}>
                  {formatCurrency(item.total_cost)}
                </MonoText>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>{formatDate(item.replacement_date)}</Text>
                <MonoText size={FontSizes.sm} weight="600">
                  {formatOdometer(item.odometer)}
                </MonoText>
              </View>

              {(item.expected_next_km || item.expected_next_date) && (
                <View style={styles.forecastBox}>
                  <Text style={styles.forecastLabel}>NEXT FORECAST: </Text>
                  <MonoText size={FontSizes.xs} weight="700" color={Colors.textPrimary}>
                    {item.expected_next_km
                      ? formatOdometer(item.expected_next_km)
                      : formatDate(item.expected_next_date)}
                  </MonoText>
                </View>
              )}
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
  backTouch: {
    minHeight: MinTouchTarget,
    justifyContent: 'center',
  },
  backLink: {
    color: Colors.primaryBlue,
    fontSize: FontSizes.base,
    fontWeight: '600',
  },
  title: {
    fontSize: FontSizes.lg,
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
  filterSection: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.p12,
  },
  chipGrid: {
    flexDirection: 'row',
    gap: Spacing.p8,
    marginBottom: Spacing.p8,
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
    fontWeight: '600',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  componentName: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subText: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
    marginTop: Spacing.p4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.p12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
  },
  forecastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    paddingHorizontal: Spacing.p12,
    paddingVertical: Spacing.p8,
    borderRadius: Radii.small,
    marginTop: Spacing.p12,
  },
  forecastLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.warning,
  },
});
