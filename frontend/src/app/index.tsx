import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useVehicle } from '@/context/VehicleContext';
import { Colors } from '@/constants/theme';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { vehicles, isLoading: vehicleLoading } = useVehicle();

  useEffect(() => {
    if (authLoading || vehicleLoading) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login' as any);
    } else if (vehicles.length === 0) {
      router.replace('/empty-home' as any);
    } else {
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, authLoading, vehicleLoading, vehicles.length]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primaryBlue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});