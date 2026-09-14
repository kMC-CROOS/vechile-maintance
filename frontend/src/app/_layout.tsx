import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { VehicleProvider } from '@/context/VehicleContext';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <VehicleProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}
        />
      </VehicleProvider>
    </AuthProvider>
  );
}
