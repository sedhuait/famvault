import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CustodyTimeline } from '@/components/custody-timeline';
import { MoveLocationModal } from '@/components/move-location-modal';
import {
  LocationVisuals,
  MetalVisuals,
  VaultMaxWidth,
  VaultPalette,
} from '@/constants/vault-theme';
import { useVault } from '@/context/vault-context';
import {
  formatDateTime,
  formatGoldWeight,
  formatINR,
  formatWeightForItem,
  getPurityLabel,
} from '@/utils/formatters';
import { calculateItemValuation } from '@/utils/valuation';

const OWNERS = ['Wife', 'Amma', 'Daughter', 'Self', 'Joint'];

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    items,
    history,
    rates,
    unitMode,
    valuationMode,
    moveItemLocation,
    transferItemOwner,
    attachBillToItem,
  } = useVault();

  const item = items.find((i) => i.id === id);

  const [moveOpen, setMoveOpen] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);

  const [nextOwner, setNextOwner] = useState(item?.ownerName ?? 'Daughter');
  const [ownerRemarks, setOwnerRemarks] = useState('');
  const [jewelerInput, setJewelerInput] = useState(item?.jewelerName ?? 'GRT Jewellers');
  const [invoiceInput, setInvoiceInput] = useState(item?.invoiceNumber ?? 'INV-2026-9012');

  const itemHistory = useMemo(
    () =>
      history
        .filter((h) => h.itemId === id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [history, id],
  );

  if (!item) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Vault item not found.</Text>
      </View>
    );
  }

  const metal = MetalVisuals[item.metalType];
  const loc = LocationVisuals[item.location];
  const valuation = calculateItemValuation(item, rates, valuationMode);
  const gain = item.purchasePrice ? valuation.cashMeltValue - item.purchasePrice : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Hero Asset Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View
              style={[
                styles.emblem,
                { backgroundColor: metal.tint, borderColor: `${metal.color}55` },
              ]}
            >
              <MaterialCommunityIcons
                name={metal.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={28}
                color={metal.color}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>
                {getPurityLabel(item.purity)} ·{' '}
                {formatWeightForItem(item.netMetalWeightGrams, item.metalType, unitMode)}
                {item.metalType === 'GOLD'
                  ? ` (${formatGoldWeight(item.netMetalWeightGrams, unitMode === 'GRAMS' ? 'PAVAN' : 'GRAMS')})`
                  : ''}
              </Text>
              {item.grossWeightGrams !== item.netMetalWeightGrams ? (
                <Text style={styles.subMeta}>
                  Gross {item.grossWeightGrams.toFixed(1)}g · Net Metal{' '}
                  {item.netMetalWeightGrams.toFixed(1)}g
                </Text>
              ) : null}
            </View>
          </View>

          {item.diamondCarats ? (
            <View style={styles.diamondBadge}>
              <MaterialCommunityIcons name="diamond-stone" size={15} color={VaultPalette.sky} />
              <Text style={styles.diamondText}>
                {item.diamondCarats.toFixed(2)} ct ({Math.round(item.diamondCarats * 100)} Cents) ·{' '}
                {item.diamondClarityColor} · Cert {item.certNumber}
              </Text>
            </View>
          ) : null}

          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: loc.tint }]}>
              <MaterialCommunityIcons
                name={loc.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={14}
                color={loc.color}
              />
              <Text style={[styles.badgeText, { color: loc.color }]}>
                {loc.label}
                {item.locationDetail ? ` (${item.locationDetail})` : ''}
              </Text>
            </View>

            <View style={styles.ownerChip}>
              <Ionicons name="person-outline" size={13} color={VaultPalette.textSecondary} />
              <Text style={styles.ownerText}>Owner: {item.ownerName}</Text>
            </View>
          </View>

          {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
        </View>

        {/* Valuation Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Valuation & Purchase Audit</Text>
          <View style={styles.valGrid}>
            <View style={styles.valBox}>
              <Text style={styles.valLabel}>Cash Melt Value</Text>
              <Text style={styles.valAmount}>{formatINR(valuation.cashMeltValue)}</Text>
            </View>
            <View style={styles.valBox}>
              <Text style={styles.valLabel}>Store Replacement (+MC & GST)</Text>
              <Text style={[styles.valAmount, { color: VaultPalette.goldBright }]}>
                {formatINR(valuation.replacementValue)}
              </Text>
            </View>
          </View>

          {item.purchasePrice ? (
            <View style={styles.purchaseRow}>
              <Text style={styles.purchaseText}>
                Purchased {item.purchaseDate ? formatDateTime(item.purchaseDate) : ''} for{' '}
                {formatINR(item.purchasePrice)}
              </Text>
              {gain !== null ? (
                <Text
                  style={[
                    styles.gainText,
                    { color: gain >= 0 ? VaultPalette.emerald : VaultPalette.crimson },
                  ]}
                >
                  {gain >= 0 ? '+' : ''}
                  {formatINR(gain)}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Quick Actions Bar */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => setMoveOpen(true)}
            style={({ pressed }) => [styles.actionBtnPrimary, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="swap-horizontal" size={16} color="#090D0B" />
            <Text style={styles.actionBtnPrimaryText}>Quick Move</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setNextOwner(item.ownerName);
              setOwnerRemarks('');
              setOwnerOpen(true);
            }}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="people-outline" size={16} color={VaultPalette.goldBright} />
            <Text style={styles.actionBtnText}>Transfer Owner</Text>
          </Pressable>

          <Pressable
            onPress={() => setBillOpen(true)}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons
              name="document-text-outline"
              size={16}
              color={item.billPhotoUri ? VaultPalette.emerald : VaultPalette.amber}
            />
            <Text
              style={[
                styles.actionBtnText,
                { color: item.billPhotoUri ? VaultPalette.emerald : VaultPalette.amber },
              ]}
            >
              {item.billPhotoUri ? 'View Bill' : 'Attach Bill'}
            </Text>
          </Pressable>
        </View>

        {/* Compressed Media Footprint Pill */}
        <View style={styles.mediaCard}>
          <Ionicons name="images-outline" size={18} color={VaultPalette.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.mediaTitle}>On-Device Compressed Media</Text>
            <Text style={styles.mediaSub}>
              Photo: {item.compressedPhotoKb ? `${item.compressedPhotoKb} KB WebP` : 'Not added'} ·
              Bill:{' '}
              {item.compressedBillKb
                ? `${item.compressedBillKb} KB WebP (${item.invoiceNumber ?? 'Invoice'})`
                : 'No GST bill attached'}
            </Text>
          </View>
        </View>

        {/* Custody & Change Timeline */}
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTitle}>Custody & Change Timeline</Text>
          <Text style={styles.timelineCount}>{itemHistory.length} events</Text>
        </View>

        <CustodyTimeline entries={itemHistory} />
      </View>

      {/* Quick Move Modal */}
      <MoveLocationModal
        visible={moveOpen}
        item={item}
        onClose={() => setMoveOpen(false)}
        onSubmit={moveItemLocation}
      />

      {/* Transfer Owner Modal */}
      <Modal
        visible={ownerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setOwnerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Transfer Family Ownership</Text>
            <Text style={styles.modalSub}>
              Logs an immutable OWNER_TRANSFERRED event in the item audit trail.
            </Text>
            <View style={styles.ownerChipsWrap}>
              {OWNERS.map((owner) => {
                const active = nextOwner === owner;
                return (
                  <Pressable
                    key={owner}
                    onPress={() => setNextOwner(owner)}
                    style={[
                      styles.ownerSelectChip,
                      active && {
                        borderColor: VaultPalette.gold,
                        backgroundColor: VaultPalette.goldTint,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.ownerSelectText, active && { color: VaultPalette.goldBright }]}
                    >
                      {owner}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={ownerRemarks}
              onChangeText={setOwnerRemarks}
              placeholder="Reason (e.g., Gifted to Daughter for marriage)"
              placeholderTextColor={VaultPalette.textMuted}
              style={styles.input}
            />
            <View style={styles.modalBtns}>
              <Pressable onPress={() => setOwnerOpen(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  transferItemOwner(item.id, nextOwner, ownerRemarks);
                  setOwnerOpen(false);
                }}
                style={styles.modalConfirm}
              >
                <Text style={styles.modalConfirmText}>Confirm Transfer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bill / Invoice Viewer or Attach Modal */}
      <Modal
        visible={billOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setBillOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {item.billPhotoUri ? 'GST Tax Invoice (WebP)' : 'Attach Compressed Bill Copy'}
            </Text>

            {item.billPhotoUri ? (
              <View style={styles.invoiceMock}>
                <View style={styles.invoiceHeader}>
                  <Text style={styles.invoiceJeweler}>
                    {item.jewelerName ?? 'Verified Jeweler'}
                  </Text>
                  <Text style={styles.invoiceTag}>TAX INVOICE</Text>
                </View>
                <Text style={styles.invoiceLine}>
                  Invoice #: {item.invoiceNumber ?? 'INV-VERIFIED'}
                </Text>
                <Text style={styles.invoiceLine}>Item: {item.title}</Text>
                <Text style={styles.invoiceLine}>
                  Purity: {getPurityLabel(item.purity)} · Net {item.netMetalWeightGrams}g
                </Text>
                <Text style={styles.invoiceLine}>
                  File: {item.billPhotoUri} ({item.compressedBillKb ?? 148} KB · 1800px WebP)
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <Text style={styles.modalSub}>
                  Simulates capturing camera invoice and running expo-image-manipulator (1800px,
                  0.80 WebP) → ~148 KB.
                </Text>
                <TextInput
                  value={jewelerInput}
                  onChangeText={setJewelerInput}
                  placeholder="Jeweler Name (e.g., Tanishq / GRT)"
                  placeholderTextColor={VaultPalette.textMuted}
                  style={styles.input}
                />
                <TextInput
                  value={invoiceInput}
                  onChangeText={setInvoiceInput}
                  placeholder="Invoice Number"
                  placeholderTextColor={VaultPalette.textMuted}
                  style={styles.input}
                />
              </View>
            )}

            <View style={styles.modalBtns}>
              <Pressable onPress={() => setBillOpen(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Close</Text>
              </Pressable>
              {!item.billPhotoUri ? (
                <Pressable
                  onPress={() => {
                    attachBillToItem(item.id, jewelerInput, invoiceInput);
                    setBillOpen(false);
                  }}
                  style={styles.modalConfirm}
                >
                  <Text style={styles.modalConfirmText}>Compress & Attach Bill</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: VaultPalette.bg,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  container: {
    width: '100%',
    maxWidth: VaultMaxWidth,
    alignSelf: 'center',
    padding: 16,
    gap: 14,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VaultPalette.bg,
  },
  notFoundText: {
    color: VaultPalette.textSecondary,
    fontSize: 15,
  },
  heroCard: {
    backgroundColor: VaultPalette.surfaceElevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: VaultPalette.borderGold,
    padding: 16,
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emblem: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: VaultPalette.text,
  },
  meta: {
    fontSize: 13,
    fontWeight: '600',
    color: VaultPalette.goldBright,
  },
  subMeta: {
    fontSize: 12,
    color: VaultPalette.textSecondary,
  },
  diamondBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: VaultPalette.skyTint,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  diamondText: {
    fontSize: 12,
    color: VaultPalette.sky,
    fontWeight: '600',
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ownerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: VaultPalette.surface,
    borderWidth: 1,
    borderColor: VaultPalette.border,
  },
  ownerText: {
    fontSize: 12,
    fontWeight: '600',
    color: VaultPalette.text,
  },
  notes: {
    fontSize: 12,
    color: VaultPalette.textSecondary,
    lineHeight: 18,
  },
  card: {
    backgroundColor: VaultPalette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: VaultPalette.text,
  },
  valGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  valBox: {
    flex: 1,
    backgroundColor: VaultPalette.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    padding: 12,
    gap: 4,
  },
  valLabel: {
    fontSize: 11,
    color: VaultPalette.textMuted,
  },
  valAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: VaultPalette.text,
    fontVariant: ['tabular-nums'],
  },
  purchaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  purchaseText: {
    fontSize: 12,
    color: VaultPalette.textSecondary,
  },
  gainText: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: VaultPalette.gold,
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#090D0B',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: VaultPalette.surface,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: VaultPalette.goldBright,
  },
  mediaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: VaultPalette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    padding: 12,
  },
  mediaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: VaultPalette.text,
  },
  mediaSub: {
    fontSize: 11,
    color: VaultPalette.textSecondary,
    marginTop: 2,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: VaultPalette.text,
  },
  timelineCount: {
    fontSize: 12,
    color: VaultPalette.gold,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: VaultPalette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: VaultPalette.borderGold,
    padding: 18,
    gap: 12,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: VaultPalette.text,
  },
  modalSub: {
    fontSize: 12,
    color: VaultPalette.textSecondary,
    lineHeight: 18,
  },
  ownerChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ownerSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    backgroundColor: VaultPalette.bg,
  },
  ownerSelectText: {
    fontSize: 13,
    fontWeight: '600',
    color: VaultPalette.textSecondary,
  },
  input: {
    backgroundColor: VaultPalette.bg,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: VaultPalette.text,
    fontSize: 14,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: VaultPalette.surfaceElevated,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: VaultPalette.textSecondary,
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: VaultPalette.gold,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#090D0B',
  },
  invoiceMock: {
    backgroundColor: '#FAF6EE',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D6CEBE',
    paddingBottom: 6,
  },
  invoiceJeweler: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  invoiceTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  invoiceLine: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
});
