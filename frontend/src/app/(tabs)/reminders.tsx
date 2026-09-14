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
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { MonoText } from '@/components/ui/MonoText';
import { StateView } from '@/components/ui/StateView';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/services/api';

export default function RemindersScreen() {
  const router = useRouter();
  const { activeVehicle } = useVehicle();

  const [remindersData, setRemindersData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const categories = ['all', 'service', 'tax', 'insurance', 'warranty', 'replacement'];

  const fetchReminders = async () => {
    if (!activeVehicle) return;
    try {
      setError(null);
      const data = await apiFetch(`/vehicles/${activeVehicle.id}/reminders`);
      setRemindersData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reminders feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (activeVehicle) {
        setLoading(true);
        fetchReminders();
      }
    }, [activeVehicle?.id])
  );

  const filterItems = (items: any[]) => {
    if (!items) return [];
    if (categoryFilter === 'all') return items;
    return items.filter((i) => i.category === categoryFilter);
  };

  const overdueList = filterItems(remindersData?.overdue);
  const dueSoonList = filterItems(remindersData?.due_soon);
  const upcomingList = filterItems(remindersData?.upcoming);

  const totalCount = overdueList.length + dueSoonList.length + upcomingList.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vehicle Reminders</Text>
        <TouchableOpacity
          style={styles.docsBtn}
          activeOpacity={0.7}
          onPress={() => router.push('/documents' as any)}>
          <Text style={styles.docsBtnText}>📁 Documents</Text>
        </TouchableOpacity>
      </View>

      {/* Category Chips */}
      <View style={styles.chipRow}>
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

      <StateView
        loading={loading}
        error={error}
        empty={totalCount === 0}
        emptyTitle="No Active Reminders"
        emptyMessage="All service schedules and document renewals are up to date."
        onRetry={fetchReminders}>
        <FlatList
          data={[
            { title: 'Overdue', status: 'overdue', data: overdueList },
            { title: 'Due Soon', status: 'due_soon', data: dueSoonList },
            { title: 'Upcoming', status: 'upcoming', data: upcomingList },
          ].filter((group) => group.data.length > 0)}
          keyExtractor={(item) => item.status}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchReminders();
              }}
              tintColor={Colors.primaryBlue}
            />
          }
          renderItem={({ item: group }) => (
            <View style={styles.groupSection}>
              <View style={styles.groupHeader}>
                <Text
                  style={[
                    styles.groupTitle,
                    {
                      color:
                        group.status === 'overdue'
                          ? Colors.error
                          : group.status === 'due_soon'
                          ? Colors.warning
                          : Colors.success,
                    },
                  ]}>
                  {group.title} ({group.data.length})
                </Text>
              </View>

              {group.data.map((reminder: any) => (
                <Card key={reminder.id} style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1, marginRight: Spacing.p8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.p8, marginBottom: Spacing.p4 }}>
                        <Badge status={reminder.status} />
                        <Text style={styles.reminderTitle} numberOfLines={1}>{reminder.title}</Text>
                      </View>
                      <Text style={styles.reminderDesc} numberOfLines={1}>{reminder.description}</Text>
                    </View>
                    <MonoText
                      size={FontSizes.sm}
                      weight="700"
                      color={
                        reminder.status === 'overdue'
                          ? Colors.error
                          : reminder.status === 'due_soon'
                          ? Colors.warning
                          : Colors.success
                      }>
                      {reminder.due_info}
                    </MonoText>
                  </View>
                </Card>
              ))}
            </View>
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
  docsBtn: {
    backgroundColor: Colors.surface2,
    paddingHorizontal: Spacing.p12,
    paddingVertical: Spacing.p8,
    borderRadius: Radii.small,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: MinTouchTarget,
    justifyContent: 'center',
  },
  docsBtnText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: FontSizes.xs,
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.p12,
    gap: Spacing.p8,
    flexWrap: 'wrap',
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
    gap: Spacing.p16,
  },
  groupSection: {
    gap: Spacing.p8,
  },
  groupHeader: {
    marginBottom: Spacing.p4,
  },
  groupTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    padding: Spacing.cardPadding,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reminderDesc: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
  },
});
