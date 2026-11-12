import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExportVaultModal } from '@/components/export-modal';
import {
  AccentThemeList,
  VaultMaxWidth,
  VaultPalette,
  type VaultPaletteType,
} from '@/constants/vault-theme';
import { useVault } from '@/context/vault-context';

export default function SettingsScreen() {
  const {
    unitMode,
    setUnitMode,
    valuationMode,
    setValuationMode,
    hidePrices,
    setHidePrices,
    compactMode,
    setCompactMode,
    accentTheme,
    setAccentTheme,
    palette,
    biometricEnabled,
    setBiometricEnabled,
    lockVault,
    isProUnlocked,
    setIsProUnlocked,
  } = useVault();

  const styles = useMemo(() => createStyles(palette), [palette]);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>100% On-Device · Theme, Display & Security</Text>
          </View>

          {/* Appearance */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="color-palette-outline" size={18} color={palette.gold} />
              <Text style={styles.cardTitle}>Vault Color</Text>
            </View>
            <View style={styles.segmentRow}>
              {AccentThemeList.map((theme) => {
                const active = accentTheme === theme.id;
                return (
                  <Pressable
                    key={theme.id}
                    onPress={() => setAccentTheme(theme.id)}
                    style={[
                      styles.segmentChip,
                      active && {
                        borderColor: palette.gold,
                        backgroundColor: palette.goldTint,
                      },
                    ]}
                  >
                    <View style={[styles.themeSwatch, { backgroundColor: theme.gold }]} />
                    <Text style={[styles.segmentText, active && { color: palette.goldBright }]}>
                      {theme.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Display & Valuation Preferences */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="options-outline" size={18} color={palette.gold} />
              <Text style={styles.cardTitle}>Display & Valuation</Text>
            </View>

            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Hide ₹ Prices</Text>
                <Text style={styles.rowSub}>Mask rupee amounts</Text>
              </View>
              <Switch
                value={hidePrices}
                onValueChange={setHidePrices}
                trackColor={{ false: VaultPalette.border, true: VaultPalette.emerald }}
                thumbColor={hidePrices ? '#ECFDF5' : VaultPalette.textMuted}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldBlock}>
              <Text style={styles.rowLabel}>View Detail</Text>
              <View style={styles.segmentRow}>
                <Pressable
                  onPress={() => setCompactMode(true)}
                  style={[
                    styles.segmentChip,
                    compactMode && {
                      borderColor: palette.gold,
                      backgroundColor: palette.goldTint,
                    },
                  ]}
                >
                  <Text style={[styles.segmentText, compactMode && { color: palette.goldBright }]}>
                    Compact
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setCompactMode(false)}
                  style={[
                    styles.segmentChip,
                    !compactMode && {
                      borderColor: palette.gold,
                      backgroundColor: palette.goldTint,
                    },
                  ]}
                >
                  <Text style={[styles.segmentText, !compactMode && { color: palette.goldBright }]}>
                    Detailed
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldBlock}>
              <Text style={styles.rowLabel}>Weight Unit</Text>
              <View style={styles.segmentRow}>
                <Pressable
                  onPress={() => setUnitMode('GRAMS')}
                  style={[
                    styles.segmentChip,
                    unitMode === 'GRAMS' && {
                      borderColor: palette.gold,
                      backgroundColor: palette.goldTint,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      unitMode === 'GRAMS' && { color: palette.goldBright },
                    ]}
                  >
                    Grams (g)
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setUnitMode('PAVAN')}
                  style={[
                    styles.segmentChip,
                    unitMode === 'PAVAN' && {
                      borderColor: palette.gold,
                      backgroundColor: palette.goldTint,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      unitMode === 'PAVAN' && { color: palette.goldBright },
                    ]}
                  >
                    Pavan (8g)
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.rowLabel}>Valuation Basis</Text>
              <View style={styles.segmentRow}>
                <Pressable
                  onPress={() => setValuationMode('CASH')}
                  style={[
                    styles.segmentChip,
                    valuationMode === 'CASH' && {
                      borderColor: palette.gold,
                      backgroundColor: palette.goldTint,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      valuationMode === 'CASH' && { color: palette.goldBright },
                    ]}
                  >
                    Cash Melt Value
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setValuationMode('REPLACEMENT')}
                  style={[
                    styles.segmentChip,
                    valuationMode === 'REPLACEMENT' && {
                      borderColor: palette.gold,
                      backgroundColor: palette.goldTint,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      valuationMode === 'REPLACEMENT' && { color: palette.goldBright },
                    ]}
                  >
                    Store Replacement
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Security */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark-outline" size={18} color={palette.gold} />
              <Text style={styles.cardTitle}>Security</Text>
            </View>

            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Biometric Lock</Text>
                <Text style={styles.rowSub}>Face ID / PIN on launch</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: VaultPalette.border, true: palette.goldDim }}
                thumbColor={biometricEnabled ? palette.goldBright : VaultPalette.textMuted}
              />
            </View>

            <Pressable
              onPress={lockVault}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="lock-closed-outline" size={16} color={palette.goldBright} />
              <Text style={styles.secondaryBtnText}>Lock Vault Now</Text>
            </Pressable>
          </View>

          {/* Data & Export */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="download-outline" size={18} color={palette.gold} />
              <Text style={styles.cardTitle}>Data & Export</Text>
            </View>
            <Pressable
              onPress={() => setExportModalVisible(true)}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="document-outline" size={16} color={palette.goldBright} />
              <Text style={styles.secondaryBtnText}>Export Vault (CSV / PDF)</Text>
            </Pressable>
          </View>

          {/* Famvault Pro */}
          <View style={[styles.card, styles.proCard]}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.proBadge}>Famvault Pro · Lifetime</Text>
                <Text style={styles.proTitle}>₹499 One-Time Family Unlock</Text>
              </View>
              <Switch
                value={isProUnlocked}
                onValueChange={setIsProUnlocked}
                trackColor={{ false: VaultPalette.border, true: palette.goldDim }}
                thumbColor={isProUnlocked ? palette.goldBright : VaultPalette.textMuted}
              />
            </View>
            <Text style={styles.rowSub}>
              Unlimited items & bills · Private cloud sync · PDF & CSV audit exports · Biometric
              lock
            </Text>
          </View>

          {/* Support */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="help-circle-outline" size={18} color={palette.gold} />
              <Text style={styles.cardTitle}>Support</Text>
            </View>
            <Text style={styles.rowSub}>
              Questions, feedback, or backup help? Contact us directly by email.
            </Text>
            <Pressable
              onPress={() => Linking.openURL('mailto:sedhu@codera.in?subject=Famvault%20Support')}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="mail-outline" size={16} color={palette.goldBright} />
              <Text style={styles.secondaryBtnText}>sedhu@codera.in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <ExportVaultModal visible={exportModalVisible} onClose={() => setExportModalVisible(false)} />
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
      paddingBottom: 32,
    },
    container: {
      width: '100%',
      maxWidth: VaultMaxWidth,
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      gap: 14,
    },
    header: {
      marginBottom: 2,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: VaultPalette.text,
    },
    subtitle: {
      fontSize: 12,
      color: VaultPalette.textSecondary,
      marginTop: 2,
    },
    card: {
      backgroundColor: VaultPalette.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      padding: 16,
      gap: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: VaultPalette.text,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    rowLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: VaultPalette.text,
    },
    rowSub: {
      fontSize: 12,
      color: VaultPalette.textSecondary,
      lineHeight: 17,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: VaultPalette.border,
    },
    fieldBlock: {
      gap: 8,
    },
    segmentRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    segmentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 13,
      paddingVertical: 9,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      backgroundColor: VaultPalette.bg,
    },
    themeSwatch: {
      width: 13,
      height: 13,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    segmentText: {
      fontSize: 13,
      fontWeight: '600',
      color: VaultPalette.textSecondary,
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
      paddingVertical: 11,
    },
    secondaryBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: palette.goldBright,
    },
    proCard: {
      borderColor: palette.borderGold,
      backgroundColor: VaultPalette.surfaceElevated,
    },
    proBadge: {
      fontSize: 10,
      fontWeight: '800',
      color: palette.gold,
      letterSpacing: 1.2,
    },
    proTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: VaultPalette.text,
      marginTop: 2,
    },
  });
