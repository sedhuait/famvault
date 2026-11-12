import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LocationVisuals, MetalVisuals, VaultPalette } from '@/constants/vault-theme';
import type { BullionRatesPerGram, ValuationMode, VaultItem, WeightUnitMode } from '@/types/vault';
import { displayINR, formatWeightForItem, getPurityLabel } from '@/utils/formatters';
import { isRenderableImageUri } from '@/utils/media-picker';
import { calculateItemValuation } from '@/utils/valuation';

interface VaultItemCardProps {
  item: VaultItem;
  rates: BullionRatesPerGram;
  unitMode: WeightUnitMode;
  valuationMode: ValuationMode;
  hidePrices?: boolean;
  onPress: () => void;
}

export function VaultItemCard({
  item,
  rates,
  unitMode,
  valuationMode,
  hidePrices = false,
  onPress,
}: VaultItemCardProps) {
  const metal = MetalVisuals[item.metalType];
  const loc = LocationVisuals[item.location];
  const val = calculateItemValuation(item, rates, valuationMode);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.topRow}>
        {/* Metal Emblem or Uploaded Jewel Photo */}
        <View
          style={[styles.emblem, { backgroundColor: metal.tint, borderColor: `${metal.color}44` }]}
        >
          {isRenderableImageUri(item.itemPhotoUri) ? (
            <Image
              source={{ uri: item.itemPhotoUri }}
              style={{ width: 42, height: 42, borderRadius: 11 }}
              contentFit="cover"
            />
          ) : (
            <MaterialCommunityIcons
              name={metal.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={22}
              color={metal.color}
            />
          )}
        </View>

        {/* Title & Purity/Weight */}
        <View style={styles.titleCol}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.subMetaRow}>
            <Text style={[styles.purityText, { color: metal.color }]}>
              {getPurityLabel(item.purity)}
            </Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.weightText}>
              {formatWeightForItem(item.netMetalWeightGrams, item.metalType, unitMode)}
            </Text>
            {item.diamondCarats ? (
              <>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.diamondText}>
                  {item.diamondCarats.toFixed(2)} ct ({Math.round(item.diamondCarats * 100)}c)
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Live Valuation */}
        <View style={styles.valueCol}>
          <Text style={styles.valueText}>{displayINR(val.activeValue, hidePrices)}</Text>
          <Text style={styles.valueModeLabel}>
            {hidePrices ? 'Price Hidden' : valuationMode === 'CASH' ? 'Melt Value' : 'Store Value'}
          </Text>
        </View>
      </View>

      {/* Bottom Badges Row */}
      <View style={styles.bottomRow}>
        <View style={[styles.pill, { backgroundColor: loc.tint }]}>
          <MaterialCommunityIcons
            name={loc.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={12}
            color={loc.color}
          />
          <Text style={[styles.pillText, { color: loc.color }]} numberOfLines={1}>
            {loc.shortLabel}
            {item.locationDetail ? ` · ${item.locationDetail}` : ''}
          </Text>
        </View>

        <View style={styles.rightPills}>
          <View style={styles.ownerPill}>
            <Ionicons name="person-outline" size={11} color={VaultPalette.textSecondary} />
            <Text style={styles.ownerText}>{item.ownerName}</Text>
          </View>

          {item.billPhotoUri ? (
            <View style={[styles.billPill, { backgroundColor: VaultPalette.emeraldTint }]}>
              <Ionicons name="document-text-outline" size={11} color={VaultPalette.emerald} />
              <Text style={[styles.billText, { color: VaultPalette.emerald }]}>
                {item.billMimeType === 'application/pdf' ? 'PDF Bill ✓' : 'Bill ✓'}
              </Text>
            </View>
          ) : (
            <View style={[styles.billPill, { backgroundColor: VaultPalette.amberTint }]}>
              <Ionicons name="alert-circle-outline" size={11} color={VaultPalette.amber} />
              <Text style={[styles.billText, { color: VaultPalette.amber }]}>No Bill</Text>
            </View>
          )}
        </View>
      </View>

      {item.location === 'GOLD_LOAN' && item.loanAmount ? (
        <View style={styles.loanBanner}>
          <Ionicons name="warning-outline" size={13} color={VaultPalette.crimson} />
          <Text style={styles.loanBannerText}>
            Pledged: {displayINR(item.loanAmount, hidePrices)} @ {item.loanInterestRate ?? 9.5}% •{' '}
            {item.loanLender}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: VaultPalette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    padding: 14,
    gap: 12,
  },
  cardPressed: {
    borderColor: VaultPalette.borderGold,
    backgroundColor: VaultPalette.surfaceElevated,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emblem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: VaultPalette.text,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  purityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    fontSize: 11,
    color: VaultPalette.textMuted,
  },
  weightText: {
    fontSize: 12,
    color: VaultPalette.textSecondary,
    fontWeight: '500',
  },
  diamondText: {
    fontSize: 12,
    color: VaultPalette.sky,
    fontWeight: '500',
  },
  valueCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '700',
    color: VaultPalette.goldBright,
    fontVariant: ['tabular-nums'],
  },
  valueModeLabel: {
    fontSize: 10,
    color: VaultPalette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  rightPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ownerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: VaultPalette.surfaceElevated,
    borderWidth: 1,
    borderColor: VaultPalette.border,
  },
  ownerText: {
    fontSize: 11,
    color: VaultPalette.textSecondary,
    fontWeight: '600',
  },
  billPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  billText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: VaultPalette.crimsonTint,
  },
  loanBannerText: {
    fontSize: 12,
    color: '#FDA4AF',
    fontWeight: '600',
  },
});
