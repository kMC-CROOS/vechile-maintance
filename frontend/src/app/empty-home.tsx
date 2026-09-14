import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, FontSizes, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function EmptyHomeScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🚗</Text>
        </View>
        <Text style={styles.title}>Welcome, {user?.name || 'Driver'}!</Text>
        <Text style={styles.description}>
          You haven't added any vehicles to VehicleCare yet. Add your vehicle to start tracking services, fuel, maintenance expenses, and upcoming reminders.
        </Text>

        <Button
          title="+ Add New Vehicle"
          onPress={() => router.push('/vehicle/add' as any)}
          style={{ width: '100%', marginTop: Spacing.p20 }}
        />

        <Button
          title="Sign Out"
          variant="secondary"
          onPress={logout}
          style={{ width: '100%', marginTop: Spacing.p12 }}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  card: {
    alignItems: 'center',
    padding: Spacing.p32,
    width: '100%',
    maxWidth: 400,
    borderRadius: Radii.medium,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.p20,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.p12,
  },
  description: {
    fontSize: FontSizes.sm,
    color: Colors.textDim,
    textAlign: 'center',
    lineHeight: 20,
  },
});
