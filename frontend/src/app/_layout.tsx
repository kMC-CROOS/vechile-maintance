import React, { useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { VehicleProvider } from '@/context/VehicleContext';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';

function RootNavigation() {
  const { isDark, theme } = useAppTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Segment-based auth guard: only checks boundary transitions, never routine pushes
  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, isLoading, segments]);

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: theme.background },
      animation: 'slide_from_right' as const,
    }),
    [theme.background]
  );

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/vehicles" />
        <Stack.Screen name="vehicle/add" />
        <Stack.Screen name="service/add" />
        <Stack.Screen name="service/[id]" />
        <Stack.Screen name="expenses/add" />
        <Stack.Screen name="documents/index" />
        <Stack.Screen name="replacements/index" />
        <Stack.Screen name="replacements/add" />
        <Stack.Screen name="empty-home" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <VehicleProvider>
          <RootNavigation />
        </VehicleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
