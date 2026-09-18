import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useVehicle } from '@/context/VehicleContext';
import { getPostAuthRoute } from '@/utils/postAuthNavigation';

export default function IndexScreen() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { vehicles, isLoading: vehiclesLoading } = useVehicle();

  // Wait for session bootstrapping on cold app launch
  if (authLoading || (isAuthenticated && vehiclesLoading && typeof user?.vehicles_count !== 'number')) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const count = typeof user?.vehicles_count === 'number' ? user.vehicles_count : vehicles.length;
  const targetRoute = getPostAuthRoute(count);

  return <Redirect href={targetRoute as any} />;
}