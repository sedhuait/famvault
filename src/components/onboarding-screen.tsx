import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FamvaultLogo } from '@/components/famvault-logo';
import { VaultFonts, VaultPalette, type VaultPaletteType } from '@/constants/vault-theme';
import { useVault } from '@/context/vault-context';
import { pickAndRestoreBackupFile } from '@/utils/vault-storage';

export function OnboardingScreen() {
  const { completeOnboarding, palette } = useVault();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biometric Unlock');
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [includeSampleData, setIncludeSampleData] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (Platform.OS === 'web') return;
      try {
        const hasHw = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!active || !hasHw || !enrolled) return;
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricLabel(Platform.OS === 'ios' ? 'Face ID Unlock' : 'Face Unlock');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricLabel(Platform.OS === 'ios' ? 'Touch ID Unlock' : 'Fingerprint Unlock');
        }
        setBiometricAvailable(true);
        setEnableBiometric(true);
      } catch {
        // Biometric unavailable
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleCreateVault = async () => {
    setErrorMsg(null);
    if (!/^\d{6}$/.test(pin)) {
      setErrorMsg('Please enter a 6-digit numeric Vault PIN.');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMsg('PINs do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboarding({
        pin,
        enableBiometric: biometricAvailable && enableBiometric,
        includeSampleData,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to create encrypted vault.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestoreBackup = async () => {
    setErrorMsg(null);
    if (!/^\d{6}$/.test(pin)) {
      setErrorMsg('Enter your backup’s 6-digit PIN first, then tap Restore.');
      return;
    }
    setSubmitting(true);
    try {
      const { snapshot } = await pickAndRestoreBackupFile(pin);
      await completeOnboarding({
        pin,
        enableBiometric: biometricAvailable && enableBiometric,
        includeSampleData: false,
        restoredSnapshot: snapshot,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'CANCELLED') return;
      setErrorMsg(err instanceof Error ? err.message : 'Unable to decrypt backup file.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Hero */}
          <View style={styles.hero}>
            <FamvaultLogo size={64} />
            <Text style={styles.brandTitle}>Famvault</Text>
            <Text style={styles.brandSub}>
              Private Family Jewelry, Bullion &amp; Locker Custody Vault
            </Text>
          </View>

          {/* Offline & Encryption Guarantees */}
          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <Ionicons name="airplane-outline" size={16} color={VaultPalette.emerald} />
              <Text style={styles.trustText}>Works 100% Offline</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="lock-closed-outline" size={16} color={palette.goldBright} />
              <Text style={styles.trustText}>Encrypted Data Store</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color={VaultPalette.sky} />
              <Text style={styles.trustText}>PIN / Biometric Required</Text>
            </View>
          </View>

          {/* Mandatory PIN Setup Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Set Your Mandatory 6-Digit PIN</Text>
            <Text style={styles.cardSub}>
              Your vault stays encrypted on this device. This PIN is required to decrypt your
              records and lock iCloud / Google Drive backups.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Create 6-Digit PIN</Text>
              <TextInput
                value={pin}
                onChangeText={(t) => {
                  setErrorMsg(null);
                  setPin(t.replace(/[^0-9]/g, '').slice(0, 6));
                }}
                keyboardType="numeric"
                secureTextEntry
                maxLength={6}
                placeholder="••••••"
                placeholderTextColor={VaultPalette.textMuted}
                style={styles.pinInput}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm 6-Digit PIN</Text>
              <TextInput
                value={confirmPin}
                onChangeText={(t) => {
                  setErrorMsg(null);
                  setConfirmPin(t.replace(/[^0-9]/g, '').slice(0, 6));
                }}
                keyboardType="numeric"
                secureTextEntry
                maxLength={6}
                placeholder="••••••"
                placeholderTextColor={VaultPalette.textMuted}
                style={styles.pinInput}
              />
            </View>

            {/* Biometric Option */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>{biometricLabel}</Text>
                <Text style={styles.switchSub}>
                  {biometricAvailable
                    ? 'Unlock faster using device biometrics (PIN stays your encryption key).'
                    : Platform.OS === 'web'
                      ? 'PIN is required on Web; Face ID / Fingerprint works on iOS & Android.'
                      : 'No device biometric enrolled; 6-digit PIN will unlock your vault.'}
                </Text>
              </View>
              <Switch
                value={biometricAvailable && enableBiometric}
                onValueChange={setEnableBiometric}
                disabled={!biometricAvailable}
                trackColor={{ false: VaultPalette.border, true: palette.goldDim }}
                thumbColor={
                  biometricAvailable && enableBiometric
                    ? palette.goldBright
                    : VaultPalette.textMuted
                }
              />
            </View>

            {/* Sample Data Option */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Include Sample Family Vault</Text>
                <Text style={styles.switchSub}>
                  Preload example gold, silver &amp; locker items to explore (you can delete
                  anytime).
                </Text>
              </View>
              <Switch
                value={includeSampleData}
                onValueChange={setIncludeSampleData}
                trackColor={{ false: VaultPalette.border, true: palette.goldDim }}
                thumbColor={includeSampleData ? palette.goldBright : VaultPalette.textMuted}
              />
            </View>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <Pressable
              onPress={handleCreateVault}
              disabled={submitting}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="lock-closed" size={17} color="#090D0B" />
              <Text style={styles.primaryBtnText}>
                {submitting ? 'Encrypting Vault...' : 'Encrypt & Open Vault'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleRestoreBackup}
              disabled={submitting}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="cloud-download-outline" size={16} color={palette.goldBright} />
              <Text style={styles.secondaryBtnText}>Restore from .famvault Backup</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: VaultPaletteType) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: VaultPalette.bg,
    },
    scrollContent: {
      paddingVertical: 24,
      paddingHorizontal: 18,
    },
    container: {
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
      gap: 18,
    },
    hero: {
      alignItems: 'center',
      gap: 8,
    },
    brandTitle: {
      fontSize: 30,
      fontWeight: '700',
      letterSpacing: 1,
      color: palette.goldBright,
      fontFamily: VaultFonts.serif,
    },
    brandSub: {
      fontSize: 13,
      color: VaultPalette.textSecondary,
      textAlign: 'center',
      maxWidth: 320,
    },
    trustGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    trustItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: VaultPalette.surface,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      borderRadius: 999,
      paddingHorizontal: 11,
      paddingVertical: 6,
    },
    trustText: {
      fontSize: 11,
      fontWeight: '600',
      color: VaultPalette.textSecondary,
    },
    card: {
      backgroundColor: VaultPalette.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.borderGold,
      padding: 18,
      gap: 14,
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: VaultPalette.text,
    },
    cardSub: {
      fontSize: 12,
      color: VaultPalette.textSecondary,
      lineHeight: 17,
    },
    field: {
      gap: 6,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: VaultPalette.textSecondary,
    },
    pinInput: {
      backgroundColor: VaultPalette.surfaceElevated,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: VaultPalette.text,
      fontSize: 18,
      letterSpacing: 6,
      textAlign: 'center',
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: 2,
    },
    switchTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: VaultPalette.text,
    },
    switchSub: {
      fontSize: 11,
      color: VaultPalette.textMuted,
      marginTop: 2,
      lineHeight: 15,
    },
    errorText: {
      fontSize: 12,
      color: VaultPalette.crimson,
      fontWeight: '600',
      textAlign: 'center',
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: palette.gold,
      borderRadius: 14,
      paddingVertical: 14,
      marginTop: 4,
    },
    primaryBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#090D0B',
    },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: VaultPalette.surfaceElevated,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      borderRadius: 12,
      paddingVertical: 12,
    },
    secondaryBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: palette.goldBright,
    },
  });
