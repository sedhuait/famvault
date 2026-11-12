import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VaultMaxWidth, VaultPalette, type VaultPaletteType } from '@/constants/vault-theme';
import { useVault } from '@/context/vault-context';
import { INITIAL_BULLION_RATES } from '@/data/mock-vault';
import type { Purity } from '@/types/vault';
import { formatINR, GRAMS_PER_PAVAN, getPurityLabel } from '@/utils/formatters';

const getRateRows = (
  palette: VaultPaletteType,
): Array<{
  purity: Purity;
  subtitle: string;
  unitLabel: string;
  multiplier: number;
  accent: string;
}> => [
  {
    purity: 'GOLD_24K',
    subtitle: 'IBJA 999 Bullion / SGB',
    unitLabel: 'per 10g',
    multiplier: 10,
    accent: palette.goldBright,
  },
  {
    purity: 'GOLD_22K',
    subtitle: '916 Hallmarked Jewelry',
    unitLabel: 'per 10g',
    multiplier: 10,
    accent: palette.gold,
  },
  {
    purity: 'GOLD_18K',
    subtitle: '750 Diamond Base',
    unitLabel: 'per 10g',
    multiplier: 10,
    accent: VaultPalette.amber,
  },
  {
    purity: 'SILVER_999',
    subtitle: 'Fine Bullion Bars / Coins',
    unitLabel: 'per 1 kg',
    multiplier: 1000,
    accent: VaultPalette.silver,
  },
  {
    purity: 'SILVER_VESSEL_80',
    subtitle: 'Pooja Vessels (80% Melt)',
    unitLabel: 'per 1 kg',
    multiplier: 1000,
    accent: VaultPalette.textSecondary,
  },
  {
    purity: 'PLATINUM_950',
    subtitle: 'Pt950 Rings & Chains',
    unitLabel: 'per 10g',
    multiplier: 10,
    accent: VaultPalette.sky,
  },
];

export default function RatesAndCalcScreen() {
  const { rates, updateRate, palette } = useVault();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const RATE_ROWS = useMemo(() => getRateRows(palette), [palette]);

  // Grams <-> Pavan calculator
  const [gramsInput, setGramsInput] = useState('48');
  const [pavanInput, setPavanInput] = useState('6.00');

  // Cents <-> Carats calculator
  const [centsInput, setCentsInput] = useState('65');
  const [caratInput, setCaratInput] = useState('0.65');

  // 22K Jewelry Store Estimator
  const [estGrams, setEstGrams] = useState('24');
  const [makingPct, setMakingPct] = useState('12');

  const handleGramsChange = (val: string) => {
    setGramsInput(val);
    const num = Number.parseFloat(val);
    if (!Number.isNaN(num)) {
      setPavanInput((num / GRAMS_PER_PAVAN).toFixed(2));
    } else {
      setPavanInput('');
    }
  };

  const handlePavanChange = (val: string) => {
    setPavanInput(val);
    const num = Number.parseFloat(val);
    if (!Number.isNaN(num)) {
      setGramsInput((num * GRAMS_PER_PAVAN).toFixed(2));
    } else {
      setGramsInput('');
    }
  };

  const handleCentsChange = (val: string) => {
    setCentsInput(val);
    const num = Number.parseFloat(val);
    if (!Number.isNaN(num)) {
      setCaratInput((num / 100).toFixed(2));
    } else {
      setCaratInput('');
    }
  };

  const handleCaratChange = (val: string) => {
    setCaratInput(val);
    const num = Number.parseFloat(val);
    if (!Number.isNaN(num)) {
      setCentsInput(String(Math.round(num * 100)));
    } else {
      setCentsInput('');
    }
  };

  const bumpGoldRates = (deltaPerGram: number) => {
    updateRate('GOLD_24K', Math.max(1000, rates.GOLD_24K + deltaPerGram));
    updateRate('GOLD_22K', Math.max(1000, Math.round(rates.GOLD_22K + deltaPerGram * 0.916)));
    updateRate('GOLD_18K', Math.max(1000, Math.round(rates.GOLD_18K + deltaPerGram * 0.75)));
  };

  const resetRates = () => {
    (Object.keys(INITIAL_BULLION_RATES) as Purity[]).forEach((purity) => {
      updateRate(purity, INITIAL_BULLION_RATES[purity]);
    });
  };

  const estWeightNum = Number.parseFloat(estGrams) || 0;
  const makingNum = Number.parseFloat(makingPct) || 0;
  const estMetalCash = estWeightNum * rates.GOLD_22K;
  const estMaking = estMetalCash * (makingNum / 100);
  const estGst = (estMetalCash + estMaking) * 0.03;
  const estTotal = estMetalCash + estMaking + estGst;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>India Bullion Rates & Tools</Text>
              <Text style={styles.subtitle}>IBJA Benchmark • Live Vault Re-pricing</Text>
            </View>
            <Pressable onPress={resetRates} style={styles.resetBtn}>
              <Ionicons name="refresh" size={14} color={palette.gold} />
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          </View>

          {/* Simulate Live Market Tick */}
          <View style={styles.simBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.simTitle}>Simulate Gold Rate Tick</Text>
              <Text style={styles.simSub}>Watch Dashboard & Vault re-calculate instantly</Text>
            </View>
            <View style={styles.simBtns}>
              <Pressable onPress={() => bumpGoldRates(-100)} style={styles.simStepBtn}>
                <Text style={styles.simStepText}>-₹100/g</Text>
              </Pressable>
              <Pressable onPress={() => bumpGoldRates(100)} style={styles.simStepBtn}>
                <Text style={styles.simStepText}>+₹100/g</Text>
              </Pressable>
            </View>
          </View>

          {/* Rates Grid */}
          <View style={styles.ratesCard}>
            {RATE_ROWS.map((row, idx) => {
              const perGram = rates[row.purity];
              const displayTotal = perGram * row.multiplier;
              return (
                <View
                  key={row.purity}
                  style={[styles.rateRow, idx < RATE_ROWS.length - 1 && styles.rateDivider]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rateTitle, { color: row.accent }]}>
                      {getPurityLabel(row.purity)}
                    </Text>
                    <Text style={styles.rateSub}>{row.subtitle}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.ratePrice}>{formatINR(displayTotal)}</Text>
                    <Text style={styles.rateUnit}>
                      {row.unitLabel} (₹{perGram.toLocaleString('en-IN')}/g)
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Grams <-> Pavan Converter */}
          <View style={styles.calcCard}>
            <View style={styles.calcHeader}>
              <MaterialCommunityIcons name="scale-balance" size={18} color={palette.gold} />
              <Text style={styles.calcTitle}>Grams ↔ Sovereign / Pavan (1 Pavan = 8g)</Text>
            </View>
            <View style={styles.calcRow}>
              <View style={styles.calcField}>
                <Text style={styles.calcLabel}>Grams (g)</Text>
                <TextInput
                  value={gramsInput}
                  onChangeText={handleGramsChange}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <Ionicons
                name="swap-horizontal"
                size={20}
                color={palette.gold}
                style={{ marginTop: 18 }}
              />
              <View style={styles.calcField}>
                <Text style={styles.calcLabel}>Pavan / Sovereign</Text>
                <TextInput
                  value={pavanInput}
                  onChangeText={handlePavanChange}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          {/* Cents <-> Carats Converter */}
          <View style={styles.calcCard}>
            <View style={styles.calcHeader}>
              <MaterialCommunityIcons name="diamond-stone" size={18} color={VaultPalette.sky} />
              <Text style={styles.calcTitle}>Diamond Cents ↔ Carats (100 Cents = 1 ct)</Text>
            </View>
            <View style={styles.calcRow}>
              <View style={styles.calcField}>
                <Text style={styles.calcLabel}>Cents</Text>
                <TextInput
                  value={centsInput}
                  onChangeText={handleCentsChange}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <Ionicons
                name="swap-horizontal"
                size={20}
                color={VaultPalette.sky}
                style={{ marginTop: 18 }}
              />
              <View style={styles.calcField}>
                <Text style={styles.calcLabel}>Carats (ct)</Text>
                <TextInput
                  value={caratInput}
                  onChangeText={handleCaratChange}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          {/* 22K Store Price Estimator */}
          <View style={styles.calcCard}>
            <View style={styles.calcHeader}>
              <Ionicons name="calculator-outline" size={18} color={VaultPalette.emerald} />
              <Text style={styles.calcTitle}>22K Store Quote Estimator (Melt vs Showroom)</Text>
            </View>

            <View style={styles.calcRow}>
              <View style={styles.calcField}>
                <Text style={styles.calcLabel}>Net Weight (g)</Text>
                <TextInput
                  value={estGrams}
                  onChangeText={setEstGrams}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={styles.calcField}>
                <Text style={styles.calcLabel}>Making Charge (%)</Text>
                <TextInput
                  value={makingPct}
                  onChangeText={setMakingPct}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.breakdownBox}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>22K Pure Metal Value</Text>
                <Text style={styles.breakdownVal}>{formatINR(estMetalCash)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Making Charges ({makingNum}%)</Text>
                <Text style={styles.breakdownVal}>{formatINR(estMaking)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>GST (3%)</Text>
                <Text style={styles.breakdownVal}>{formatINR(estGst)}</Text>
              </View>
              <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                <Text style={styles.breakdownTotalLabel}>Estimated Showroom Price</Text>
                <Text style={styles.breakdownTotalVal}>{formatINR(estTotal)}</Text>
              </View>
            </View>
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    resetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: VaultPalette.surface,
      borderWidth: 1,
      borderColor: palette.borderGold,
    },
    resetText: {
      fontSize: 12,
      fontWeight: '600',
      color: palette.gold,
    },
    simBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: palette.goldTint,
      borderWidth: 1,
      borderColor: palette.borderGold,
      borderRadius: 14,
      padding: 12,
    },
    simTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: palette.goldBright,
    },
    simSub: {
      fontSize: 11,
      color: VaultPalette.textSecondary,
      marginTop: 1,
    },
    simBtns: {
      flexDirection: 'row',
      gap: 6,
    },
    simStepBtn: {
      backgroundColor: VaultPalette.surface,
      borderWidth: 1,
      borderColor: palette.borderGold,
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    simStepText: {
      fontSize: 11,
      fontWeight: '700',
      color: palette.goldBright,
    },
    ratesCard: {
      backgroundColor: VaultPalette.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      paddingHorizontal: 14,
    },
    rateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    rateDivider: {
      borderBottomWidth: 1,
      borderBottomColor: VaultPalette.border,
    },
    rateTitle: {
      fontSize: 14,
      fontWeight: '700',
    },
    rateSub: {
      fontSize: 11,
      color: VaultPalette.textMuted,
      marginTop: 2,
    },
    ratePrice: {
      fontSize: 16,
      fontWeight: '800',
      color: VaultPalette.text,
      fontVariant: ['tabular-nums'],
    },
    rateUnit: {
      fontSize: 11,
      color: VaultPalette.textSecondary,
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },
    calcCard: {
      backgroundColor: VaultPalette.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      padding: 14,
      gap: 12,
    },
    calcHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    calcTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: VaultPalette.text,
      flexShrink: 1,
    },
    calcRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    calcField: {
      flex: 1,
      gap: 5,
    },
    calcLabel: {
      fontSize: 11,
      color: VaultPalette.textSecondary,
      fontWeight: '600',
    },
    input: {
      backgroundColor: VaultPalette.bg,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      borderRadius: 11,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: VaultPalette.text,
      fontSize: 15,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    breakdownBox: {
      backgroundColor: VaultPalette.bg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      padding: 12,
      gap: 7,
    },
    breakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    breakdownLabel: {
      fontSize: 12,
      color: VaultPalette.textSecondary,
    },
    breakdownVal: {
      fontSize: 12,
      fontWeight: '600',
      color: VaultPalette.text,
      fontVariant: ['tabular-nums'],
    },
    breakdownTotalRow: {
      marginTop: 4,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: VaultPalette.border,
    },
    breakdownTotalLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: VaultPalette.emerald,
    },
    breakdownTotalVal: {
      fontSize: 15,
      fontWeight: '800',
      color: VaultPalette.emerald,
      fontVariant: ['tabular-nums'],
    },
  });
