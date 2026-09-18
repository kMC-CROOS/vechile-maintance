import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MonoText } from '@/components/ui/MonoText';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/services/api';
import { formatOdometer } from '@/utils/format';
import { navigatePostAuth } from '@/utils/postAuthNavigation';

export default function ManageVehiclesScreen() {
  const router = useRouter();
  const { vehicles, activeVehicle, setActiveVehicle, reloadVehicles } = useVehicle();

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteVehicle = (vehicleId: number, name: string) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${name}? All associated fuel logs, service records, and expenses will be deleted permanently.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(vehicleId);
            try {
              await apiFetch(`/vehicles/${vehicleId}`, { method: 'DELETE' });
              const updated = await reloadVehicles();
              if (updated.length === 0) {
                navigatePostAuth(0);
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete vehicle');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Vehicles</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/vehicle/add' as any)}
          activeOpacity={0.7}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {vehicles.map((v) => {
          const isActive = activeVehicle?.id === v.id;
          return (
            <Card
              key={v.id}
              style={[styles.card, isActive && styles.activeCard]}>
              <TouchableOpacity
                style={styles.cardMain}
                activeOpacity={0.7}
                onPress={() => {
                  setActiveVehicle(v);
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(tabs)' as any);
                  }
                }}>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.vehicleName}>
                      {v.brand} {v.model}
                    </Text>
                    {isActive && <Badge status="valid" label="ACTIVE" />}
                  </View>

                  <MonoText size={14} weight="700" color={Colors.textDim} style={styles.plateText}>
                    {v.registration_number}
                  </MonoText>
                  <Text style={styles.subText}>
                    {v.type.toUpperCase()} • {v.fuel_type} • {v.transmission}
                  </Text>

                  <View style={styles.odoWrapper}>
                    <Text style={styles.odoLabel}>CURRENT ODOMETER:</Text>
                    <MonoText size={14} weight="700" color={Colors.primaryBlue}>
                      {formatOdometer(v.current_odometer)}
                    </MonoText>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteVehicle(v.id, `${v.brand} ${v.model}`)}
                  disabled={deletingId === v.id}
                  activeOpacity={0.7}>
                  <Text style={styles.deleteBtnText}>
                    {deletingId === v.id ? 'Deleting...' : 'Delete Vehicle'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}

        <Button
          title="+ Add New Vehicle"
          onPress={() => router.push('/vehicle/add' as any)}
          style={{ marginTop: Spacing.p8 }}
        />
      </ScrollView>
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
  headerBtn: {
    minHeight: MinTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.p4,
  },
  backLink: {
    color: Colors.primaryBlue,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  addText: {
    color: Colors.primaryBlue,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    gap: Spacing.itemGap,
  },
  card: {
    padding: Spacing.cardPadding,
  },
  activeCard: {
    borderColor: Colors.primaryBlue,
    backgroundColor: Colors.surface2,
  },
  cardMain: {
    flexDirection: 'row',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.p8,
    marginBottom: Spacing.p4,
  },
  vehicleName: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  plateText: {
    marginTop: Spacing.p4,
  },
  subText: {
    fontSize: FontSizes.xs,
    color: Colors.textFaint,
    marginTop: Spacing.p4,
  },
  odoWrapper: {
    marginTop: Spacing.p12,
  },
  odoLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textFaint,
    marginBottom: Spacing.p4,
  },
  actionRow: {
    marginTop: Spacing.p12,
    paddingTop: Spacing.p8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
    alignItems: 'flex-end',
  },
  deleteBtn: {
    minHeight: MinTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.p12,
  },
  deleteBtnText: {
    color: Colors.error,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
});

