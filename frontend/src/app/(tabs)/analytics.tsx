import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { MonoText } from '@/components/ui/MonoText';
import { StateView } from '@/components/ui/StateView';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/services/api';
import { formatCurrency } from '@/utils/format';

export default function AnalyticsScreen() {
  const { activeVehicle } = useVehicle();

  const [period, setPeriod] = useState<'1m' | '3m' | '6m' | '1y'>('6m');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periods: ('1m' | '3m' | '6m' | '1y')[] = ['1m', '3m', '6m', '1y'];

  const fetchAnalytics = async () => {
    if (!activeVehicle) return;
    try {
      setError(null);
      const res = await apiFetch(`/vehicles/${activeVehicle.id}/analytics?period=${period}`);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (activeVehicle) {
        setLoading(true);
        fetchAnalytics();
      }
    }, [activeVehicle?.id, period])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cost & Performance Analytics</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {periods.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            activeOpacity={0.7}
            onPress={() => setPeriod(p)}>
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <StateView loading={loading} error={error} onRetry={fetchAnalytics}>
        {data && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchAnalytics();
                }}
                tintColor={Colors.primaryBlue}
              />
            }>
            {/* HERO TOTAL COST TILE */}
            <Card style={styles.heroTile}>
              <Text style={styles.heroLabel}>TOTAL SPENT ({period.toUpperCase()})</Text>
              <MonoText size={FontSizes.xxl} weight="800" color={Colors.textPrimary}>
                {formatCurrency(data.cost_tiles.total)}
              </MonoText>

              <View style={styles.kpiRow}>
                <View style={styles.kpiBox}>
                  <Text style={styles.kpiLabel}>AVG FUEL EFFICIENCY</Text>
                  <MonoText size={FontSizes.lg} weight="800" color={Colors.success}>
                    {data.fuel_efficiency_km_l > 0 ? `${data.fuel_efficiency_km_l} KM/L` : 'N/A'}
                  </MonoText>
                </View>

                <View style={styles.kpiBox}>
                  <Text style={styles.kpiLabel}>COST PER KM</Text>
                  <MonoText size={FontSizes.lg} weight="800" color={Colors.warning}>
                    {data.cost_per_km > 0 ? `LKR ${data.cost_per_km}/KM` : 'N/A'}
                  </MonoText>
                </View>
              </View>
            </Card>

            {/* COST BREAKDOWN TILES */}
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            <View style={styles.grid}>
              <Card style={styles.gridTile}>
                <Text style={styles.tileLabel}>Fuel Expenses</Text>
                <MonoText size={FontSizes.base} weight="700" color={Colors.success}>
                  {formatCurrency(data.cost_tiles.fuel)}
                </MonoText>
                <Text style={styles.pctText}>{data.category_breakdown.fuel}% of total</Text>
              </Card>

              <Card style={styles.gridTile}>
                <Text style={styles.tileLabel}>Service Expenses</Text>
                <MonoText size={FontSizes.base} weight="700" color={Colors.primaryBlue}>
                  {formatCurrency(data.cost_tiles.service)}
                </MonoText>
                <Text style={styles.pctText}>{data.category_breakdown.service}% of total</Text>
              </Card>

              <Card style={styles.gridTile}>
                <Text style={styles.tileLabel}>Replacements</Text>
                <MonoText size={FontSizes.base} weight="700" color={Colors.warning}>
                  {formatCurrency(data.cost_tiles.replacement)}
                </MonoText>
                <Text style={styles.pctText}>{data.category_breakdown.replacement}% of total</Text>
              </Card>

              <Card style={styles.gridTile}>
                <Text style={styles.tileLabel}>Other Expenses</Text>
                <MonoText size={FontSizes.base} weight="700" color={Colors.textDim}>
                  {formatCurrency(data.cost_tiles.other)}
                </MonoText>
                <Text style={styles.pctText}>{data.category_breakdown.other}% of total</Text>
              </Card>
            </View>

            {/* MONTHLY TREND SERIES */}
            <Text style={styles.sectionTitle}>Monthly Spend Trend</Text>
            <Card style={styles.trendCard}>
              {data.monthly_trend.map((m: any) => {
                const maxVal = Math.max(...data.monthly_trend.map((i: any) => i.total), 1);
                const pct = Math.min(100, Math.round((m.total / maxVal) * 100));

                return (
                  <View key={m.month} style={styles.trendRow}>
                    <View style={styles.trendLabelCol}>
                      <Text style={styles.monthText}>{m.month}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%` }]} />
                    </View>
                    <MonoText size={FontSizes.xs} weight="700" style={{ width: 90, textAlign: 'right' }}>
                      {formatCurrency(m.total)}
                    </MonoText>
                  </View>
                );
              })}
            </Card>

            {/* ACTIVITY COUNTS */}
            <Text style={styles.sectionTitle}>Maintenance Activity Counts</Text>
            <Card style={styles.countsCard}>
              <View style={styles.countItem}>
                <MonoText size={FontSizes.xl} weight="800" color={Colors.primaryBlue}>
                  {data.activity_counts.services}
                </MonoText>
                <Text style={styles.countLabel}>Services Logged</Text>
              </View>
              <View style={styles.countItem}>
                <MonoText size={FontSizes.xl} weight="800" color={Colors.success}>
                  {data.activity_counts.fuel_entries}
                </MonoText>
                <Text style={styles.countLabel}>Fuel Entries</Text>
              </View>
              <View style={styles.countItem}>
                <MonoText size={FontSizes.xl} weight="800" color={Colors.warning}>
                  {data.activity_counts.replacements}
                </MonoText>
                <Text style={styles.countLabel}>Part Replacements</Text>
              </View>
            </Card>
          </ScrollView>
        )}
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
  periodRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.p12,
    gap: Spacing.p8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  periodBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radii.small,
    minHeight: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodBtnActive: {
    backgroundColor: Colors.blueDim,
    borderColor: Colors.primaryBlue,
  },
  periodText: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  periodTextActive: {
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    gap: Spacing.p16,
  },
  heroTile: {
    padding: Spacing.p20,
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textFaint,
    marginBottom: Spacing.p4,
  },
  kpiRow: {
    flexDirection: 'row',
    marginTop: Spacing.p20,
    gap: Spacing.p12,
    width: '100%',
  },
  kpiBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.p12,
    borderRadius: Radii.small,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textFaint,
    marginBottom: Spacing.p4,
  },
  sectionTitle: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.p12,
  },
  gridTile: {
    width: '48%',
    padding: Spacing.p16,
  },
  tileLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
    marginBottom: Spacing.p4,
  },
  pctText: {
    fontSize: FontSizes.xs,
    color: Colors.textFaint,
    marginTop: Spacing.p4,
  },
  trendCard: {
    padding: Spacing.cardPadding,
    gap: Spacing.p12,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.p8,
  },
  trendLabelCol: {
    width: 60,
  },
  monthText: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.surface,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primaryBlue,
    borderRadius: 5,
  },
  countsCard: {
    flexDirection: 'row',
    padding: Spacing.cardPadding,
    justifyContent: 'space-around',
  },
  countItem: {
    alignItems: 'center',
  },
  countLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
    marginTop: Spacing.p4,
  },
});
