import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddItemModal } from '@/components/add-item-modal';
import {
  LocationVisuals,
  MetalVisuals,
  VaultFonts,
  VaultMaxWidth,
  VaultPalette,
  type VaultPaletteType,
} from '@/constants/vault-theme';
import { useVault } from '@/context/vault-context';
import type { CbdtCategory, CustodyLocation, MetalType } from '@/types/vault';
import {
  displayINR,
  formatDateTime,
  formatGoldWeight,
  formatSilverWeight,
} from '@/utils/formatters';
import { calculateItemValuation, computeCbdtCoverage, summarizePortfolio } from '@/utils/valuation';

export default function DashboardScreen() {
  const {
    items,
    history,
    rates,
    members,
    unitMode,
    valuationMode,
    hidePrices,
    palette,
    toggleHidePrices,
    lockVault,
    addVaultItem,
    addFamilyMember,
  } = useVault();

  const styles = useMemo(() => createStyles(palette), [palette]);
  const [addVisible, setAddVisible] = useState(false);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberCategory, setNewMemberCategory] =
    useState<Exclude<CbdtCategory, 'JOINT'>>('MALE');

  const summary = useMemo(
    () => summarizePortfolio(items, rates, valuationMode),
    [items, rates, valuationMode],
  );

  const cbdtRows = useMemo(() => computeCbdtCoverage(items, members), [items, members]);

  const custodyBreakdown = useMemo(() => {
    const locations: CustodyLocation[] = [
      'BANK_LOCKER',
      'HOME_SAFE',
      'POOJA_ROOM',
      'GOLD_LOAN',
      'DAILY_WEAR',
    ];
    return locations.map((loc) => {
      const matching = items.filter((i) => i.location === loc);
      const value = matching.reduce(
        (sum, item) => sum + calculateItemValuation(item, rates, valuationMode).activeValue,
        0,
      );
      return { loc, count: matching.length, value };
    });
  }, [items, rates, valuationMode]);

  const netEquity = Math.max(0, summary.totalActiveValue - summary.totalLoanPrincipal);
  const appreciation = summary.totalActiveValue - summary.totalPurchaseCost;
  const appreciationPct =
    summary.totalPurchaseCost > 0 ? (appreciation / summary.totalPurchaseCost) * 100 : 0;

  const loanedItems = items.filter((i) => i.location === 'GOLD_LOAN');
  const reminderItems = items.filter((i) => Boolean(i.returnReminderDate));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Top Biometric Status Header */}
          <View style={styles.topBar}>
            <View style={styles.brandGroup}>
              <View style={styles.logoMark}>
                <MaterialCommunityIcons name="safe-square-outline" size={20} color={palette.gold} />
              </View>
              <View style={styles.brandTextCol}>
                <Text style={styles.brandName} numberOfLines={1}>
                  Famvault
                </Text>
                <View style={styles.bioVerifiedRow}>
                  <Ionicons name="shield-checkmark" size={11} color={VaultPalette.emerald} />
                  <Text style={styles.bioVerifiedText} numberOfLines={1}>
                    Biometric · On-Device
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                onPress={lockVault}
                accessibilityLabel="Lock Vault"
                style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="lock-closed-outline" size={17} color={palette.gold} />
              </Pressable>
              <Pressable
                onPress={() => setAddVisible(true)}
                accessibilityLabel="Add Precious Asset"
                style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="add" size={18} color="#090D0B" />
              </Pressable>
            </View>
          </View>

          {/* Live Bullion Ticker Ribbon */}
          <Pressable
            onPress={() => router.push('/(tabs)/rates')}
            style={({ pressed }) => [styles.tickerBar, pressed && { opacity: 0.8 }]}
          >
            <View style={styles.tickerLiveDot} />
            <Text style={styles.tickerText} numberOfLines={1}>
              24K ₹{rates.GOLD_24K.toLocaleString('en-IN')}/g · 22K ₹
              {rates.GOLD_22K.toLocaleString('en-IN')}/g · Silver ₹{rates.SILVER_999}/g · Pt950 ₹
              {rates.PLATINUM_950.toLocaleString('en-IN')}/g
            </Text>
            <Ionicons name="chevron-forward" size={14} color={VaultPalette.textMuted} />
          </Pressable>

          {/* Hero Portfolio Valuation Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeaderRow}>
              <Text style={styles.heroLabel}>
                Total Precious Wealth · {valuationMode === 'CASH' ? 'Melt' : 'Replacement'}
              </Text>
              <Pressable
                onPress={toggleHidePrices}
                style={[
                  styles.togglePill,
                  hidePrices && {
                    backgroundColor: VaultPalette.emeraldTint,
                    borderColor: 'rgba(16, 185, 129, 0.45)',
                  },
                ]}
              >
                <Ionicons
                  name={hidePrices ? 'eye-off-outline' : 'eye-outline'}
                  size={13}
                  color={hidePrices ? VaultPalette.emerald : palette.goldBright}
                />
                <Text
                  style={[styles.togglePillText, hidePrices && { color: VaultPalette.emerald }]}
                >
                  {hidePrices ? 'Hidden' : 'Hide'}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.heroAmount}>
              {displayINR(summary.totalActiveValue, hidePrices)}
            </Text>

            <View style={styles.heroMetricsRow}>
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricLabel}>Net Equity (ex-Loan)</Text>
                <Text style={styles.heroMetricValue}>
                  {displayINR(netEquity, hidePrices, true)}
                </Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricLabel}>Appreciation</Text>
                <Text style={[styles.heroMetricValue, { color: VaultPalette.emerald }]}>
                  {hidePrices
                    ? `•••• (${appreciationPct.toFixed(0)}%)`
                    : `+${displayINR(appreciation, false, true)} (${appreciationPct.toFixed(0)}%)`}
                </Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricLabel}>GST Bills</Text>
                <Text style={styles.heroMetricValue}>
                  {summary.billCoveredCount}/{summary.totalItemsCount} Items
                </Text>
              </View>
            </View>
          </View>

          {/* 4-Metal Breakdown Grid */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Asset Allocation</Text>
            <Pressable onPress={() => router.push('/(tabs)/vault')}>
              <Text style={styles.sectionLink}>View All ({items.length})</Text>
            </Pressable>
          </View>

          <View style={styles.metalGrid}>
            {(
              [
                {
                  type: 'GOLD' as MetalType,
                  weight: formatGoldWeight(summary.goldGrams, unitMode),
                  sub: '24K / 22K / 18K',
                  value: summary.byMetalValue.GOLD,
                },
                {
                  type: 'SILVER' as MetalType,
                  weight: formatSilverWeight(summary.silverGrams),
                  sub: 'Includes 80% Vessel Melt',
                  value: summary.byMetalValue.SILVER,
                },
                {
                  type: 'DIAMOND' as MetalType,
                  weight: `${summary.diamondCarats.toFixed(2)} ct (${Math.round(summary.diamondCarats * 100)}c)`,
                  sub: 'Studded + IGI Cert',
                  value: summary.byMetalValue.DIAMOND,
                },
                {
                  type: 'PLATINUM' as MetalType,
                  weight: `${summary.platinumGrams.toFixed(1)} g`,
                  sub: 'Pt950 Certified',
                  value: summary.byMetalValue.PLATINUM,
                },
              ] as const
            ).map((card) => {
              const vis = MetalVisuals[card.type];
              return (
                <Pressable
                  key={card.type}
                  onPress={() => router.push('/(tabs)/vault')}
                  style={({ pressed }) => [styles.metalCard, pressed && { opacity: 0.85 }]}
                >
                  <View style={styles.metalCardTop}>
                    <View style={[styles.metalIconBox, { backgroundColor: vis.tint }]}>
                      <MaterialCommunityIcons
                        name={vis.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={18}
                        color={vis.color}
                      />
                    </View>
                    <Text style={[styles.metalName, { color: vis.color }]}>{vis.label}</Text>
                  </View>
                  <Text style={styles.metalValue}>{displayINR(card.value, hidePrices, true)}</Text>
                  <Text style={styles.metalWeight}>{card.weight}</Text>
                  <Text style={styles.metalSub}>{card.sub}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custody Snapshot */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Custody Snapshot</Text>
            <Text style={styles.sectionCaption}>Where items sit right now</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.custodyScroll}
          >
            {custodyBreakdown.map(({ loc, count, value }) => {
              const vis = LocationVisuals[loc];
              return (
                <Pressable
                  key={loc}
                  onPress={() => router.push('/(tabs)/vault')}
                  style={styles.custodyCard}
                >
                  <View style={[styles.custodyIcon, { backgroundColor: vis.tint }]}>
                    <MaterialCommunityIcons
                      name={vis.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={18}
                      color={vis.color}
                    />
                  </View>
                  <Text style={styles.custodyLabel}>{vis.shortLabel}</Text>
                  <Text style={styles.custodyValue}>{displayINR(value, hidePrices, true)}</Text>
                  <Text style={styles.custodyCount}>
                    {count} {count === 1 ? 'item' : 'items'}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Active Custody & Gold Loan Alerts */}
          {(loanedItems.length > 0 || reminderItems.length > 0) && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Custody & Loan Alerts</Text>
              </View>
              <View style={styles.alertsStack}>
                {loanedItems.map((loanItem) => (
                  <Pressable
                    key={loanItem.id}
                    onPress={() => router.push(`/item/${loanItem.id}`)}
                    style={[styles.alertCard, { borderColor: 'rgba(244, 63, 94, 0.4)' }]}
                  >
                    <View
                      style={[styles.alertBadge, { backgroundColor: VaultPalette.crimsonTint }]}
                    >
                      <Ionicons name="alert-circle" size={18} color={VaultPalette.crimson} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.alertTitle}>Gold Loan Due · {loanItem.title}</Text>
                      <Text style={styles.alertSub}>
                        {displayINR(loanItem.loanAmount ?? 0, hidePrices)} @{' '}
                        {loanItem.loanInterestRate}% with {loanItem.loanLender}
                        {loanItem.loanMaturityDate
                          ? ` · Due ${formatDateTime(loanItem.loanMaturityDate)}`
                          : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={VaultPalette.textMuted} />
                  </Pressable>
                ))}

                {reminderItems.map((remItem) => (
                  <Pressable
                    key={remItem.id}
                    onPress={() => router.push(`/item/${remItem.id}`)}
                    style={[styles.alertCard, { borderColor: 'rgba(245, 158, 11, 0.4)' }]}
                  >
                    <View style={[styles.alertBadge, { backgroundColor: VaultPalette.amberTint }]}>
                      <Ionicons name="time-outline" size={18} color={VaultPalette.amber} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.alertTitle}>
                        Locker Return Reminder · {remItem.title}
                      </Text>
                      <Text style={styles.alertSub}>
                        Currently in {LocationVisuals[remItem.location].label} · Return by{' '}
                        {remItem.returnReminderDate
                          ? formatDateTime(remItem.returnReminderDate)
                          : 'soon'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={VaultPalette.textMuted} />
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* CBDT Safe-Limit & GST Bill Coverage Meter */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CBDT Limit & Bill Coverage</Text>
            <Pressable onPress={() => setMemberModalVisible(true)}>
              <Text style={styles.sectionLink}>+ Add Member</Text>
            </Pressable>
          </View>

          <View style={styles.cbdtCard}>
            {cbdtRows.map((row) => {
              const ratio = Math.min(1, row.totalGoldGrams / row.safeLimitGrams);
              const billedRatio =
                row.totalGoldGrams > 0 ? row.billBackedGrams / row.safeLimitGrams : 0;
              return (
                <View key={row.member.name} style={styles.cbdtRow}>
                  <View style={styles.cbdtRowHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.cbdtMember}>{row.member.name}</Text>
                      <Text style={styles.cbdtCategory}>
                        ({row.member.cbdtSafeLimitGrams}g limit)
                      </Text>
                    </View>
                    <Text style={styles.cbdtValues}>
                      {formatGoldWeight(row.totalGoldGrams, unitMode)} total ·{' '}
                      <Text style={{ color: VaultPalette.emerald }}>
                        {row.billBackedGrams.toFixed(0)}g billed
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[styles.progressUnbilled, { width: `${Math.min(100, ratio * 100)}%` }]}
                    />
                    <View
                      style={[
                        styles.progressBilled,
                        { width: `${Math.min(100, billedRatio * 100)}%` },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
            <View style={styles.cbdtLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: VaultPalette.emerald }]} />
                <Text style={styles.legendText}>GST Bill Attached</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: palette.gold }]} />
                <Text style={styles.legendText}>Unbilled (Within CBDT Exemption)</Text>
              </View>
            </View>
          </View>

          {/* Recent Custody Activity */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Custody Log</Text>
            <Pressable onPress={() => router.push('/(tabs)/vault')}>
              <Text style={styles.sectionLink}>Inspect Items</Text>
            </Pressable>
          </View>

          <View style={styles.activityCard}>
            {history.slice(0, 4).map((entry, index) => {
              const targetItem = items.find((i) => i.id === entry.itemId);
              return (
                <Pressable
                  key={entry.id}
                  onPress={() => {
                    if (targetItem) router.push(`/item/${targetItem.id}`);
                  }}
                  style={[styles.activityRow, index < 3 && styles.activityDivider]}
                >
                  <View style={styles.activityDot} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.activityItemTitle} numberOfLines={1}>
                      {targetItem?.title ?? 'Vault Asset'}
                    </Text>
                    <Text style={styles.activityDelta} numberOfLines={1}>
                      {entry.newValue ?? entry.actionType}
                    </Text>
                    {entry.remarks ? (
                      <Text style={styles.activityRemarks} numberOfLines={1}>
                        “{entry.remarks}”
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.activityDate}>{formatDateTime(entry.timestamp)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <AddItemModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onAdd={(payload) => addVaultItem(payload)}
      />

      {/* Add Family Member Modal */}
      <Modal
        visible={memberModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setMemberModalVisible(false)}
      >
        <View style={styles.memberBackdrop}>
          <View style={styles.memberCard}>
            <Text style={styles.memberTitle}>Add Family Member</Text>
            <Text style={styles.memberSub}>
              Assign gold holdings &amp; CBDT safe limits to any family member (boys, girls,
              parents).
            </Text>
            <TextInput
              value={newMemberName}
              onChangeText={setNewMemberName}
              placeholder="e.g., Arjun (Son), Appa, Sister"
              placeholderTextColor={VaultPalette.textMuted}
              style={styles.memberInput}
            />
            <View style={styles.memberCatList}>
              {(
                [
                  { cat: 'MALE', label: 'Boy / Male (100g limit)' },
                  { cat: 'UNMARRIED_WOMAN', label: 'Girl / Unmarried (250g limit)' },
                  { cat: 'MARRIED_WOMAN', label: 'Married Woman (500g limit)' },
                ] as const
              ).map((opt) => {
                const active = newMemberCategory === opt.cat;
                return (
                  <Pressable
                    key={opt.cat}
                    onPress={() => setNewMemberCategory(opt.cat)}
                    style={[styles.memberCatChip, active && styles.memberCatChipActive]}
                  >
                    <Text style={[styles.memberCatText, active && { color: palette.goldBright }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.memberBtns}>
              <Pressable
                onPress={() => setMemberModalVisible(false)}
                style={styles.memberCancelBtn}
              >
                <Text style={styles.memberCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (newMemberName.trim()) {
                    addFamilyMember(newMemberName, newMemberCategory);
                    setNewMemberName('');
                    setMemberModalVisible(false);
                  }
                }}
                style={styles.memberSaveBtn}
              >
                <Text style={styles.memberSaveText}>Add Member</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
      gap: 16,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    brandGroup: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    brandTextCol: {
      flex: 1,
      minWidth: 0,
    },
    logoMark: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: palette.goldTint,
      borderWidth: 1,
      borderColor: palette.borderGold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandName: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: 0.6,
      color: palette.goldBright,
      fontFamily: VaultFonts.serif,
    },
    bioVerifiedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    bioVerifiedText: {
      fontSize: 11,
      color: VaultPalette.emerald,
      fontWeight: '500',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
    },
    iconBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: VaultPalette.surface,
      borderWidth: 1,
      borderColor: palette.borderGold,
    },
    addBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: palette.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tickerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: VaultPalette.surface,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    tickerLiveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: VaultPalette.emerald,
    },
    tickerText: {
      flex: 1,
      fontSize: 12,
      color: VaultPalette.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    heroCard: {
      backgroundColor: VaultPalette.surfaceElevated,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.borderGold,
      padding: 18,
      gap: 10,
    },
    heroHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    togglePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: palette.goldTint,
      borderWidth: 1,
      borderColor: palette.borderGold,
    },
    togglePillText: {
      fontSize: 11,
      fontWeight: '600',
      color: palette.goldBright,
    },
    heroLabel: {
      flex: 1,
      fontSize: 11,
      color: VaultPalette.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
    },
    heroAmount: {
      fontSize: 34,
      fontWeight: '800',
      color: VaultPalette.text,
      fontVariant: ['tabular-nums'],
    },
    heroMetricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: VaultPalette.border,
    },
    heroMetric: {
      flex: 1,
      gap: 3,
    },
    heroMetricLabel: {
      fontSize: 10,
      color: VaultPalette.textMuted,
      textTransform: 'uppercase',
    },
    heroMetricValue: {
      fontSize: 13,
      fontWeight: '700',
      color: VaultPalette.text,
      fontVariant: ['tabular-nums'],
    },
    heroDivider: {
      width: 1,
      height: 28,
      backgroundColor: VaultPalette.border,
      marginHorizontal: 10,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: VaultPalette.text,
    },
    sectionLink: {
      fontSize: 13,
      fontWeight: '600',
      color: palette.gold,
    },
    sectionCaption: {
      fontSize: 12,
      color: VaultPalette.textMuted,
    },
    metalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    metalCard: {
      width: '48.5%',
      flexGrow: 1,
      minWidth: 155,
      backgroundColor: VaultPalette.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      padding: 14,
      gap: 5,
    },
    metalCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    metalIconBox: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metalName: {
      fontSize: 13,
      fontWeight: '700',
    },
    metalValue: {
      fontSize: 19,
      fontWeight: '800',
      color: VaultPalette.text,
      fontVariant: ['tabular-nums'],
    },
    metalWeight: {
      fontSize: 13,
      fontWeight: '600',
      color: palette.goldBright,
    },
    metalSub: {
      fontSize: 11,
      color: VaultPalette.textMuted,
    },
    custodyScroll: {
      gap: 10,
      paddingRight: 8,
    },
    custodyCard: {
      width: 132,
      backgroundColor: VaultPalette.surface,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      padding: 12,
      gap: 4,
    },
    custodyIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    custodyLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: VaultPalette.textSecondary,
    },
    custodyValue: {
      fontSize: 15,
      fontWeight: '700',
      color: VaultPalette.text,
      fontVariant: ['tabular-nums'],
    },
    custodyCount: {
      fontSize: 11,
      color: VaultPalette.textMuted,
    },
    alertsStack: {
      gap: 8,
    },
    alertCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: VaultPalette.surface,
      borderRadius: 14,
      borderWidth: 1,
      padding: 12,
    },
    alertBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    alertTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: VaultPalette.text,
    },
    alertSub: {
      fontSize: 12,
      color: VaultPalette.textSecondary,
    },
    cbdtCard: {
      backgroundColor: VaultPalette.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      padding: 14,
      gap: 12,
    },
    cbdtRow: {
      gap: 6,
    },
    cbdtRowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cbdtMember: {
      fontSize: 13,
      fontWeight: '700',
      color: VaultPalette.text,
    },
    cbdtCategory: {
      fontSize: 11,
      color: VaultPalette.textMuted,
    },
    cbdtValues: {
      fontSize: 12,
      color: VaultPalette.textSecondary,
      fontWeight: '600',
    },
    progressTrack: {
      height: 7,
      borderRadius: 4,
      backgroundColor: VaultPalette.surfaceElevated,
      overflow: 'hidden',
      position: 'relative',
    },
    progressUnbilled: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: palette.gold,
      borderRadius: 4,
    },
    progressBilled: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: VaultPalette.emerald,
      borderRadius: 4,
    },
    cbdtLegend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: VaultPalette.border,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 11,
      color: VaultPalette.textMuted,
    },
    activityCard: {
      backgroundColor: VaultPalette.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      padding: 14,
    },
    activityRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 10,
    },
    activityDivider: {
      borderBottomWidth: 1,
      borderBottomColor: VaultPalette.border,
    },
    activityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: palette.gold,
      marginTop: 5,
    },
    activityItemTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: VaultPalette.text,
    },
    activityDelta: {
      fontSize: 12,
      color: VaultPalette.textSecondary,
    },
    activityRemarks: {
      fontSize: 11,
      color: VaultPalette.textMuted,
      fontStyle: 'italic',
    },
    activityDate: {
      fontSize: 11,
      color: VaultPalette.textMuted,
    },
    memberBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
      justifyContent: 'center',
      padding: 20,
    },
    memberCard: {
      backgroundColor: VaultPalette.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.borderGold,
      padding: 18,
      gap: 12,
      maxWidth: 440,
      width: '100%',
      alignSelf: 'center',
    },
    memberTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: VaultPalette.text,
    },
    memberSub: {
      fontSize: 12,
      color: VaultPalette.textSecondary,
      lineHeight: 18,
    },
    memberInput: {
      backgroundColor: VaultPalette.bg,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      borderRadius: 11,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: VaultPalette.text,
      fontSize: 14,
    },
    memberCatList: {
      gap: 8,
    },
    memberCatChip: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      backgroundColor: VaultPalette.bg,
    },
    memberCatChipActive: {
      borderColor: palette.borderGold,
      backgroundColor: palette.goldTint,
    },
    memberCatText: {
      fontSize: 12,
      fontWeight: '600',
      color: VaultPalette.textSecondary,
    },
    memberBtns: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    memberCancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: VaultPalette.surfaceElevated,
      alignItems: 'center',
    },
    memberCancelText: {
      fontSize: 13,
      fontWeight: '600',
      color: VaultPalette.textSecondary,
    },
    memberSaveBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: palette.gold,
      alignItems: 'center',
    },
    memberSaveText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#090D0B',
    },
  });
