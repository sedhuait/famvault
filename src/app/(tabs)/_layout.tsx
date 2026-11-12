import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { VaultPalette } from '@/constants/vault-theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: VaultPalette.goldBright,
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
          title: 'Dashboard',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="shield-checkmark-outline"
              size={size}
              color={focused ? VaultPalette.goldBright : VaultPalette.textMuted}
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
              color={focused ? VaultPalette.goldBright : VaultPalette.textMuted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rates"
        options={{
          title: 'Rates & Calc',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="stats-chart-outline"
              size={size}
              color={focused ? VaultPalette.goldBright : VaultPalette.textMuted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="backup"
        options={{
          title: 'Backup',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="cloud-done-outline"
              size={size}
              color={focused ? VaultPalette.goldBright : VaultPalette.textMuted}
            />
          ),
        }}
      />
    </Tabs>
  );
}
