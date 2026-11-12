import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { BiometricGate } from '@/components/biometric-gate';
import { VaultPalette } from '@/constants/vault-theme';
import { useVault, VaultProvider } from '@/context/vault-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

function VaultRootNavigator() {
  const { isUnlocked, palette } = useVault();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const navTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: palette.gold,
        background: palette.bg,
        card: palette.surface,
        text: palette.text,
        border: palette.border,
        notification: palette.gold,
      },
    }),
    [palette],
  );

  return (
    <ThemeProvider value={navTheme}>
      <View style={{ flex: 1, backgroundColor: VaultPalette.bg }}>
        {!isUnlocked ? (
          <BiometricGate />
        ) : (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: palette.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="item/[id]"
              options={{
                headerShown: true,
                headerTitle: 'Asset Custody Ledger',
                headerStyle: { backgroundColor: palette.surface },
                headerTintColor: palette.goldBright,
                headerBackTitle: 'Vault',
              }}
            />
            <Stack.Screen
              name="backup"
              options={{
                headerShown: true,
                headerTitle: 'Backup & Family Sharing',
                headerStyle: { backgroundColor: palette.surface },
                headerTintColor: palette.goldBright,
                headerBackTitle: 'Settings',
              }}
            />
          </Stack>
        )}
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <VaultProvider>
      <StatusBar style="light" />
      <VaultRootNavigator />
    </VaultProvider>
  );
}
