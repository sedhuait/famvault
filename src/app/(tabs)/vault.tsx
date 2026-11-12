import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddItemModal } from '@/components/add-item-modal';
import { ExportVaultModal } from '@/components/export-modal';
import { VaultItemCard } from '@/components/vault-item-card';
import {
  LocationVisuals,
  MetalVisuals,
  VaultMaxWidth,
  VaultPalette,
} from '@/constants/vault-theme';
import { useVault } from '@/context/vault-context';
import type { CustodyLocation, MetalType } from '@/types/vault';
import { displayINR } from '@/utils/formatters';
import { calculateItemValuation } from '@/utils/valuation';

const METAL_FILTERS: Array<'ALL' | MetalType> = ['ALL', 'GOLD', 'SILVER', 'DIAMOND', 'PLATINUM'];
const LOCATION_FILTERS: Array<'ALL' | CustodyLocation> = [
  'ALL',
  'BANK_LOCKER',
  'HOME_SAFE',
  'POOJA_ROOM',
  'GOLD_LOAN',
  'DAILY_WEAR',
];

export default function VaultLedgerScreen() {
  const {
    items,
    rates,
    unitMode,
    valuationMode,
    hidePrices,
    toggleUnitMode,
    toggleHidePrices,
    addVaultItem,
  } = useVault();

  const [search, setSearch] = useState('');
  const [metalFilter, setMetalFilter] = useState<'ALL' | MetalType>('ALL');
  const [locationFilter, setLocationFilter] = useState<'ALL' | CustodyLocation>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');
  const [addVisible, setAddVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);

  const owners = useMemo(
    () => ['ALL', ...Array.from(new Set(items.map((item) => item.ownerName)))],
    [items],
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (metalFilter !== 'ALL' && item.metalType !== metalFilter) return false;
      if (locationFilter !== 'ALL' && item.location !== locationFilter) return false;
      if (ownerFilter !== 'ALL' && item.ownerName !== ownerFilter) return false;
      if (q) {
        const hay =
          `${item.title} ${item.jewelerName ?? ''} ${item.locationDetail ?? ''} ${item.ownerName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, metalFilter, locationFilter, ownerFilter, search]);

  const filteredValue = useMemo(
    () =>
      filteredItems.reduce(
        (sum, item) => sum + calculateItemValuation(item, rates, valuationMode).activeValue,
        0,
      ),
    [filteredItems, rates, valuationMode],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title} numberOfLines={1}>
              Family Vault Ledger
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {filteredItems.length} items · {displayINR(filteredValue, hidePrices)}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={toggleHidePrices}
              style={({ pressed }) => [
                styles.unitBtn,
                hidePrices && { borderColor: 'rgba(16, 185, 129, 0.45)' },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons
                name={hidePrices ? 'eye-off-outline' : 'eye-outline'}
                size={16}
                color={hidePrices ? VaultPalette.emerald : VaultPalette.goldBright}
              />
            </Pressable>
            <Pressable onPress={toggleUnitMode} style={styles.unitBtn}>
              <Text style={styles.unitBtnText}>{unitMode === 'GRAMS' ? 'g' : 'Pavan'}</Text>
            </Pressable>
            <Pressable
              onPress={() => setExportVisible(true)}
              style={({ pressed }) => [styles.unitBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="download-outline" size={16} color={VaultPalette.goldBright} />
            </Pressable>
            <Pressable
              onPress={() => setAddVisible(true)}
              style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="add" size={18} color="#090D0B" />
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={VaultPalette.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search ornament, jeweler, locker #..."
            placeholderTextColor={VaultPalette.textMuted}
            style={styles.searchInput}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={VaultPalette.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersBlock}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {METAL_FILTERS.map((m) => {
              const active = metalFilter === m;
              const label = m === 'ALL' ? 'All Metals' : MetalVisuals[m].label;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMetalFilter(m)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {LOCATION_FILTERS.map((loc) => {
              const active = locationFilter === loc;
              const label = loc === 'ALL' ? 'All Locations' : LocationVisuals[loc].shortLabel;
              return (
                <Pressable
                  key={loc}
                  onPress={() => setLocationFilter(loc)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
            {owners.map((owner) => {
              if (owner === 'ALL') return null;
              const active = ownerFilter === owner;
              return (
                <Pressable
                  key={owner}
                  onPress={() => setOwnerFilter(active ? 'ALL' : owner)}
                  style={[styles.chip, active && styles.chipOwnerActive]}
                >
                  <Text style={[styles.chipText, active && { color: VaultPalette.emerald }]}>
                    {owner}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Items List */}
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="search" size={28} color={VaultPalette.textMuted} />
              <Text style={styles.emptyTitle}>No matching assets</Text>
              <Text style={styles.emptySub}>Try clearing filters or add a new item.</Text>
            </View>
          ) : (
            filteredItems.map((item) => (
              <VaultItemCard
                key={item.id}
                item={item}
                rates={rates}
                unitMode={unitMode}
                valuationMode={valuationMode}
                hidePrices={hidePrices}
                onPress={() => router.push(`/item/${item.id}`)}
              />
            ))
          )}
        </ScrollView>
      </View>

      <AddItemModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onAdd={(payload) => addVaultItem(payload)}
      />

      <ExportVaultModal
        visible={exportVisible}
        onClose={() => setExportVisible(false)}
        filteredItems={filteredItems}
        scopeHint="Filtered Vault View"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: VaultPalette.bg,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: VaultMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
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
    color: VaultPalette.gold,
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitBtn: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: VaultPalette.surface,
    borderWidth: 1,
    borderColor: VaultPalette.border,
  },
  unitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: VaultPalette.goldBright,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: VaultPalette.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#090D0B',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: VaultPalette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: VaultPalette.text,
  },
  filtersBlock: {
    gap: 8,
  },
  chipRow: {
    gap: 7,
    paddingRight: 10,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: VaultPalette.surface,
    borderWidth: 1,
    borderColor: VaultPalette.border,
  },
  chipActive: {
    backgroundColor: VaultPalette.goldTint,
    borderColor: VaultPalette.borderGold,
  },
  chipOwnerActive: {
    backgroundColor: VaultPalette.emeraldTint,
    borderColor: VaultPalette.emerald,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: VaultPalette.textSecondary,
  },
  chipTextActive: {
    color: VaultPalette.goldBright,
  },
  listContent: {
    gap: 10,
    paddingBottom: 28,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    backgroundColor: VaultPalette.surface,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: VaultPalette.text,
  },
  emptySub: {
    fontSize: 12,
    color: VaultPalette.textMuted,
  },
});
