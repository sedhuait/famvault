import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { BiometricGate } from '@/components/biometric-gate';
import { VaultPalette } from '@/constants/vault-theme';
import { useVault, VaultProvider } from '@/context/vault-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

const VaultNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: VaultPalette.gold,
    background: VaultPalette.bg,
    card: VaultPalette.surface,
    text: VaultPalette.text,
    border: VaultPalette.border,
    notification: VaultPalette.gold,
  },
};

function VaultRootNavigator() {
  const { isUnlocked } = useVault();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: VaultPalette.bg }}>
      {!isUnlocked ? (
        <BiometricGate />
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: VaultPalette.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="item/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Asset Custody Ledger',
              headerStyle: { backgroundColor: VaultPalette.surface },
              headerTintColor: VaultPalette.goldBright,
              headerBackTitle: 'Vault',
            }}
          />
        </Stack>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={VaultNavigationTheme}>
      <StatusBar style="light" />
      <VaultProvider>
        <VaultRootNavigator />
      </VaultProvider>
    </ThemeProvider>
  );
}
