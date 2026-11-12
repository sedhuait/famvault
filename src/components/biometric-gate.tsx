import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FamvaultLogo } from '@/components/famvault-logo';
import { VaultFonts, VaultPalette, type VaultPaletteType } from '@/constants/vault-theme';
import { useVault } from '@/context/vault-context';

const DEMO_PIN = '123456';

export function BiometricGate() {
  const { unlockVault, biometricEnabled, hidePrices, items, palette } = useVault();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [authStatus, setAuthStatus] = useState<'IDLE' | 'SCANNING' | 'VERIFIED' | 'PIN'>('IDLE');
  const [hardwareLabel, setHardwareLabel] = useState<string>('Face ID / Biometric');
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ringOpacity, {
            toValue: 0.85,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.35,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim, ringOpacity]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setHardwareLabel('Biometric Vault Lock');
      return;
    }

    (async () => {
      try {
        const hasHw = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHw && enrolled) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setHardwareLabel('Face ID');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setHardwareLabel('Touch ID / Fingerprint');
          }
        } else {
          setHardwareLabel('Simulator Biometric / PIN');
        }
      } catch {
        setHardwareLabel('Biometric / PIN');
      }
    })();
  }, []);

  const handleBiometricUnlock = async () => {
    setPinError(null);
    setAuthStatus('SCANNING');

    if (Platform.OS !== 'web' && biometricEnabled) {
      try {
        const hasHw = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHw && enrolled) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Unlock Famvault',
            fallbackLabel: 'Use 6-Digit PIN',
            cancelLabel: 'Cancel',
          });
          if (result.success) {
            setAuthStatus('VERIFIED');
            setTimeout(unlockVault, 320);
            return;
          }
          setAuthStatus('PIN');
          return;
        }
      } catch {
        // Fall through to simulated scan on Expo Go / Simulator
      }
    }

    // Polished interactive biometric scan animation for Web / Simulator preview
    setTimeout(() => {
      setAuthStatus('VERIFIED');
      setTimeout(() => {
        unlockVault();
      }, 420);
    }, 650);
  };

  const handlePinDigit = (digit: string) => {
    setPinError(null);
    if (pinInput.length >= 6) return;
    const next = `${pinInput}${digit}`;
    setPinInput(next);
    if (next.length === 6) {
      if (next === DEMO_PIN) {
        setAuthStatus('VERIFIED');
        setTimeout(() => {
          setPinInput('');
          unlockVault();
        }, 280);
      } else {
        setPinError('Incorrect PIN. Demo PIN is 123456.');
        setTimeout(() => setPinInput(''), 450);
      }
    }
  };

  const handleBackspace = () => {
    setPinError(null);
    setPinInput((prev) => prev.slice(0, -1));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Crest & Brand Header */}
        <View style={styles.brandHeader}>
          <FamvaultLogo size={56} borderRadius={18} />
          <Text style={styles.brandTitle}>Famvault</Text>
          <Text style={styles.brandSubtitle}>Indian Family Precious Metals & Custody Vault</Text>
        </View>

        {/* Center Interactive Biometric / PIN Area */}
        {authStatus === 'PIN' ? (
          <View style={styles.pinContainer}>
            <Text style={styles.pinHeading}>Enter 6-Digit Recovery PIN</Text>
            <Text style={styles.pinHint}>Demo PIN: 123456</Text>

            <View style={styles.pinDotsRow}>
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const filled = idx < pinInput.length;
                return <View key={idx} style={[styles.pinDot, filled && styles.pinDotFilled]} />;
              })}
            </View>

            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}

            <View style={styles.keypad}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <Pressable
                  key={digit}
                  onPress={() => handlePinDigit(digit)}
                  style={({ pressed }) => [styles.keyButton, pressed && styles.keyButtonPressed]}
                >
                  <Text style={styles.keyText}>{digit}</Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => setAuthStatus('IDLE')}
                style={({ pressed }) => [styles.keyButtonGhost, pressed && styles.keyButtonPressed]}
              >
                <Ionicons name="finger-print" size={22} color={palette.gold} />
              </Pressable>
              <Pressable
                onPress={() => handlePinDigit('0')}
                style={({ pressed }) => [styles.keyButton, pressed && styles.keyButtonPressed]}
              >
                <Text style={styles.keyText}>0</Text>
              </Pressable>
              <Pressable
                onPress={handleBackspace}
                style={({ pressed }) => [styles.keyButtonGhost, pressed && styles.keyButtonPressed]}
              >
                <Ionicons name="backspace-outline" size={22} color={VaultPalette.textSecondary} />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.biometricCenter}>
            <Pressable
              onPress={handleBiometricUnlock}
              disabled={authStatus === 'SCANNING' || authStatus === 'VERIFIED'}
              style={styles.scannerTouchable}
            >
              <Animated.View
                style={[
                  styles.scannerOuterRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: ringOpacity,
                    borderColor: authStatus === 'VERIFIED' ? VaultPalette.emerald : palette.gold,
                  },
                ]}
              />
              <View
                style={[
                  styles.scannerCircle,
                  authStatus === 'VERIFIED' && styles.scannerCircleVerified,
                ]}
              >
                {authStatus === 'VERIFIED' ? (
                  <Ionicons name="checkmark-circle" size={56} color={VaultPalette.emerald} />
                ) : authStatus === 'SCANNING' ? (
                  <MaterialCommunityIcons
                    name="face-recognition"
                    size={52}
                    color={palette.goldBright}
                  />
                ) : (
                  <Ionicons name="finger-print" size={54} color={palette.gold} />
                )}
              </View>
            </Pressable>

            <Text style={styles.statusTitle}>
              {authStatus === 'VERIFIED'
                ? 'Vault Unlocked'
                : authStatus === 'SCANNING'
                  ? `Verifying ${hardwareLabel}...`
                  : 'Vault Locked'}
            </Text>
            <Text style={styles.statusSub}>
              {authStatus === 'SCANNING'
                ? 'Verifying your identity...'
                : hidePrices
                  ? `${items.length} Family Assets • Prices Hidden`
                  : `${items.length} Family Assets • 100% On-Device`}
            </Text>

            <Pressable
              onPress={handleBiometricUnlock}
              disabled={authStatus !== 'IDLE'}
              style={({ pressed }) => [styles.unlockPrimaryBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="shield-checkmark" size={18} color="#090D0B" />
              <Text style={styles.unlockPrimaryText}>Unlock with {hardwareLabel}</Text>
            </Pressable>

            <Pressable
              onPress={() => setAuthStatus('PIN')}
              style={({ pressed }) => [styles.pinFallbackBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.pinFallbackText}>Enter 6-Digit Vault PIN</Text>
            </Pressable>
          </View>
        )}

        {/* Privacy & Trust Footer */}
        <View style={styles.trustFooter}>
          <View style={styles.trustPill}>
            <Ionicons name="lock-closed" size={12} color={VaultPalette.emerald} />
            <Text style={styles.trustText}>100% On-Device</Text>
          </View>
          <View style={styles.trustPill}>
            <Ionicons name="cloud-done-outline" size={12} color={palette.gold} />
            <Text style={styles.trustText}>Private Cloud Backup</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (palette: VaultPaletteType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: VaultPalette.bg,
    },
    inner: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 28,
      maxWidth: 480,
      width: '100%',
      alignSelf: 'center',
    },
    brandHeader: {
      alignItems: 'center',
      marginTop: 12,
      gap: 8,
    },
    brandTitle: {
      fontSize: 30,
      fontWeight: '700',
      letterSpacing: 1.2,
      color: palette.goldBright,
      fontFamily: VaultFonts.serif,
    },
    brandSubtitle: {
      fontSize: 13,
      color: VaultPalette.textSecondary,
      textAlign: 'center',
    },
    biometricCenter: {
      alignItems: 'center',
      width: '100%',
      gap: 14,
    },
    scannerTouchable: {
      width: 148,
      height: 148,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    scannerOuterRing: {
      position: 'absolute',
      width: 144,
      height: 144,
      borderRadius: 72,
      borderWidth: 1.5,
    },
    scannerCircle: {
      width: 112,
      height: 112,
      borderRadius: 56,
      backgroundColor: VaultPalette.surfaceElevated,
      borderWidth: 1,
      borderColor: palette.borderGold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scannerCircleVerified: {
      borderColor: VaultPalette.emerald,
      backgroundColor: VaultPalette.emeraldTint,
    },
    statusTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: VaultPalette.text,
    },
    statusSub: {
      fontSize: 13,
      color: VaultPalette.textSecondary,
      marginBottom: 8,
    },
    unlockPrimaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: palette.gold,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 14,
      width: '100%',
    },
    unlockPrimaryText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#090D0B',
    },
    pinFallbackBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    pinFallbackText: {
      fontSize: 13,
      fontWeight: '600',
      color: palette.gold,
    },
    pinContainer: {
      width: '100%',
      alignItems: 'center',
      gap: 12,
    },
    pinHeading: {
      fontSize: 18,
      fontWeight: '700',
      color: VaultPalette.text,
    },
    pinHint: {
      fontSize: 12,
      color: VaultPalette.textMuted,
    },
    pinDotsRow: {
      flexDirection: 'row',
      gap: 14,
      marginVertical: 8,
    },
    pinDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: palette.borderGold,
      backgroundColor: 'transparent',
    },
    pinDotFilled: {
      backgroundColor: palette.gold,
      borderColor: palette.goldBright,
    },
    pinError: {
      fontSize: 12,
      color: VaultPalette.crimson,
    },
    keypad: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: 264,
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 6,
    },
    keyButton: {
      width: 78,
      height: 54,
      borderRadius: 14,
      backgroundColor: VaultPalette.surfaceElevated,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyButtonGhost: {
      width: 78,
      height: 54,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyButtonPressed: {
      backgroundColor: palette.goldTint,
      borderColor: palette.borderGold,
    },
    keyText: {
      fontSize: 22,
      fontWeight: '600',
      color: VaultPalette.text,
    },
    trustFooter: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 10,
    },
    trustPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: VaultPalette.surface,
      borderWidth: 1,
      borderColor: VaultPalette.border,
    },
    trustText: {
      fontSize: 11,
      color: VaultPalette.textSecondary,
      fontWeight: '500',
    },
  });
