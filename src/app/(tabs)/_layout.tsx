import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { VaultPalette } from '@/constants/vault-theme';
import { useVaultPalette } from '@/context/vault-context';

export default function TabsLayout() {
  const palette = useVaultPalette();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.goldBright,
        tabBarInactiveTintColor: VaultPalette.textMuted,
        tabBarStyle: {
          backgroundColor: VaultPalette.surface,
          borderTopColor: VaultPalette.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={focused ? palette.goldBright : VaultPalette.textMuted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ focused, size }) => (
            <MaterialCommunityIcons
              name="safe-square-outline"
              size={size}
              color={focused ? palette.goldBright : VaultPalette.textMuted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rates"
        options={{
          title: 'Gold Rates',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="stats-chart-outline"
              size={size}
              color={focused ? palette.goldBright : VaultPalette.textMuted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="settings-outline"
              size={size}
              color={focused ? palette.goldBright : VaultPalette.textMuted}
            />
          ),
        }}
      />
    </Tabs>
  );
}
