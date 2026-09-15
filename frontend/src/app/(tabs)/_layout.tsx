import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';

export default function TabLayout() {
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
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="fuel"
        options={{
          title: 'Fuel',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⛽</Text>,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Service',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🔧</Text>,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>💳</Text>,
        }}
      />
      <Tabs.Screen
        name="docs"
        options={{
          title: 'Docs',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📁</Text>,
        }}
      />
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
