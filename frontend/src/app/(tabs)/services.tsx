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

export default function ServicesScreen() {
  const router = useRouter();
  const { activeVehicle } = useVehicle();

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  const fetchServices = async () => {
    if (!activeVehicle) return;
    try {
      setError(null);
      const data = await apiFetch(`/vehicles/${activeVehicle.id}/services`);
      setServices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load service records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (activeVehicle) {
        setLoading(true);
        fetchServices();
      }
    }, [activeVehicle?.id])
  );

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      (s.workshop_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.notes || '').toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Service Records</Text>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.7}
          onPress={() => router.push('/service/add' as any)}>
          <Text style={styles.addBtnText}>+ Log Service</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter */}
      <View style={styles.filterSection}>
        <Input
          placeholder="Search workshop or service..."
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: Spacing.p8 }}
        />
      </View>

      <StateView
        loading={loading}
        error={error}
        empty={filteredServices.length === 0}
        emptyTitle="No Service Records"
        emptyMessage="Logged service records and maintenance history will appear here."
        onRetry={fetchServices}
        onAction={() => router.push('/service/add' as any)}
        actionTitle="+ Log Service">
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchServices();
              }}
              tintColor={Colors.primaryBlue}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/service/${item.id}` as any)}
              activeOpacity={0.7}>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, marginRight: Spacing.p12 }}>
                    <Text style={styles.workshopName} numberOfLines={1}>
                      {item.workshop_name || 'General Workshop'}
                    </Text>
                    <Text style={styles.dateText}>{formatDate(item.service_date)}</Text>
                  </View>
                  <MonoText size={FontSizes.base} weight="800" color={Colors.primaryBlue}>
                    {formatCurrency(item.total_cost)}
                  </MonoText>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                  <View style={styles.rowItem}>
                    <Text style={styles.label}>Odometer: </Text>
                    <MonoText size={FontSizes.sm} weight="600">
                      {formatOdometer(item.odometer)}
                    </MonoText>
                  </View>

                  {item.next_service_due_odometer && (
                    <View style={styles.rowItem}>
                      <Text style={styles.label}>Next Due: </Text>
                      <MonoText size={FontSizes.sm} weight="600" color={Colors.warning}>
                        {formatOdometer(item.next_service_due_odometer)}
                      </MonoText>
                    </View>
                  )}
                </View>

                {item.services_performed && item.services_performed.length > 0 && (
                  <View style={styles.chipRow}>
                    {item.services_performed.map((chip: string) => (
                      <View key={chip} style={styles.chip}>
                        <Text style={styles.chipText}>{chip.replace('_', ' ')}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            </TouchableOpacity>
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
  filterSection: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.p12,
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
  workshopName: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dateText: {
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
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.p8,
    marginTop: Spacing.p12,
  },
  chip: {
    backgroundColor: Colors.surface2,
    paddingHorizontal: Spacing.p8,
    paddingVertical: Spacing.p4,
    borderRadius: 6,
  },
  chipText: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    textTransform: 'capitalize',
  },
});
