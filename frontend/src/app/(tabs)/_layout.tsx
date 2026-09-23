import { DashboardIcon } from '@/components/dashboard/DashboardIcon';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primaryBlue,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          height: 62 + Math.max(insets.bottom, 8),
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarItemStyle: { flex: 1, minWidth: 0 },
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <DashboardIcon name="home" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="fuel"
        options={{
          title: 'Fuel',
          tabBarIcon: ({ color }) => <DashboardIcon name="fuel" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Service',
          tabBarIcon: ({ color }) => <DashboardIcon name="service" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          href: null,
          tabBarIcon: ({ color }) => <DashboardIcon name="wallet" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="docs"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color }) => <DashboardIcon name="document" color={color} size={24} />,
        }}
      />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color }) => <DashboardIcon name="more" color={color} size={24} /> }} />
      <Tabs.Screen
        name="analytics"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
