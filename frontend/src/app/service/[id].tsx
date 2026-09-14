import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MonoText } from '@/components/ui/MonoText';
import { StateView } from '@/components/ui/StateView';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';
import { apiFetch } from '@/services/api';
import { formatCurrency, formatDate, formatOdometer } from '@/utils/format';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    try {
      setError(null);
      const data = await apiFetch(`/services/${id}`);
      setService(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load service detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleDelete = () => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this service record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await apiFetch(`/services/${id}`, { method: 'DELETE' });
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete service record');
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerTouch} activeOpacity={0.7} onPress={() => router.back()}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <TouchableOpacity style={styles.headerTouch} activeOpacity={0.7} onPress={handleDelete} disabled={deleting}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <StateView loading={loading} error={error} onRetry={fetchDetail}>
        {service && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Card style={styles.heroCard}>
              <Text style={styles.workshopName}>{service.workshop_name || 'General Workshop'}</Text>
              <Text style={styles.dateText}>{formatDate(service.service_date)}</Text>

              <View style={styles.costContainer}>
                <Text style={styles.costLabel}>TOTAL COST</Text>
                <MonoText size={FontSizes.xxl} weight="800" color={Colors.primaryBlue}>
                  {formatCurrency(service.total_cost)}
                </MonoText>
              </View>
            </Card>

            <Card style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Service Info</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Odometer</Text>
                <MonoText size={FontSizes.base} weight="700">
                  {formatOdometer(service.odometer)}
                </MonoText>
              </View>

              {service.next_service_due_odometer && (
                <View style={styles.row}>
                  <Text style={styles.label}>Next Due Odometer</Text>
                  <MonoText size={FontSizes.base} weight="700" color={Colors.warning}>
                    {formatOdometer(service.next_service_due_odometer)}
                  </MonoText>
                </View>
              )}

              {service.mechanic_name && (
                <View style={styles.row}>
                  <Text style={styles.label}>Mechanic</Text>
                  <Text style={styles.val}>{service.mechanic_name}</Text>
                </View>
              )}

              {service.mechanic_phone && (
                <View style={styles.row}>
                  <Text style={styles.label}>Mechanic Phone</Text>
                  <Text style={styles.val}>{service.mechanic_phone}</Text>
                </View>
              )}
            </Card>

            {service.services_performed && service.services_performed.length > 0 && (
              <Card style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Services Performed</Text>
                <View style={styles.chipGrid}>
                  {service.services_performed.map((chip: string) => (
                    <View key={chip} style={styles.chip}>
                      <Text style={styles.chipText}>✓ {chip.replace('_', ' ')}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {service.notes && (
              <Card style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{service.notes}</Text>
              </Card>
            )}
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
  headerTouch: {
    minHeight: MinTouchTarget,
    justifyContent: 'center',
  },
  backLink: {
    color: Colors.primaryBlue,
    fontSize: FontSizes.base,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  deleteText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    gap: Spacing.p16,
  },
  heroCard: {
    padding: Spacing.p20,
    alignItems: 'center',
  },
  workshopName: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  dateText: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
    marginTop: Spacing.p4,
  },
  costContainer: {
    marginTop: Spacing.p16,
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textFaint,
    marginBottom: Spacing.p4,
  },
  detailsCard: {
    padding: Spacing.cardPadding,
  },
  sectionTitle: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.p12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.p12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
  },
  label: {
    fontSize: FontSizes.sm,
    color: Colors.textDim,
  },
  val: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.p8,
  },
  chip: {
    backgroundColor: Colors.blueDim,
    paddingHorizontal: Spacing.p12,
    paddingVertical: Spacing.p8,
    borderRadius: Radii.small,
  },
  chipText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  notesText: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
});
