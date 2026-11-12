import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LocationVisuals, MetalVisuals, VaultPalette } from '@/constants/vault-theme';
import type { AddItemPayload } from '@/context/vault-context';
import type { CustodyLocation, ItemCategory, MetalType, Purity } from '@/types/vault';
import { getPurityLabel } from '@/utils/formatters';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (payload: AddItemPayload) => void;
}

const METAL_TYPES: MetalType[] = ['GOLD', 'SILVER', 'DIAMOND', 'PLATINUM'];
const OWNERS = ['Wife', 'Amma', 'Daughter', 'Self', 'Joint'];
const LOCATIONS: CustodyLocation[] = ['BANK_LOCKER', 'HOME_SAFE', 'POOJA_ROOM', 'DAILY_WEAR'];

const DEFAULT_PURITY: Record<MetalType, Purity[]> = {
  GOLD: ['GOLD_22K', 'GOLD_24K', 'GOLD_18K'],
  SILVER: ['SILVER_999', 'SILVER_925', 'SILVER_VESSEL_80'],
  DIAMOND: ['GOLD_18K', 'GOLD_14K', 'PLATINUM_950'],
  PLATINUM: ['PLATINUM_950'],
};

const DEFAULT_CATEGORY: Record<MetalType, ItemCategory> = {
  GOLD: 'NECKLACE',
  SILVER: 'POOJA_VESSEL',
  DIAMOND: 'RING',
  PLATINUM: 'RING',
};

export function AddItemModal({ visible, onClose, onAdd }: AddItemModalProps) {
  const [title, setTitle] = useState('');
  const [metalType, setMetalType] = useState<MetalType>('GOLD');
  const [purity, setPurity] = useState<Purity>('GOLD_22K');
  const [netWeight, setNetWeight] = useState('24.0');
  const [grossWeight, setGrossWeight] = useState('25.2');
  const [diamondCarats, setDiamondCarats] = useState('0.65');
  const [location, setLocation] = useState<CustodyLocation>('BANK_LOCKER');
  const [locationDetail, setLocationDetail] = useState('SBI Anna Nagar #42');
  const [ownerName, setOwnerName] = useState('Wife');
  const [jewelerName, setJewelerName] = useState('GRT Jewellers');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-4102');
  const [attachPhoto, setAttachPhoto] = useState(true);
  const [attachBill, setAttachBill] = useState(true);

  const handleSelectMetal = (m: MetalType) => {
    setMetalType(m);
    setPurity(DEFAULT_PURITY[m][0]);
    if (m === 'SILVER') {
      setNetWeight('650');
      setGrossWeight('650');
      setLocation('POOJA_ROOM');
      setLocationDetail('Main Mandir');
    } else {
      setNetWeight('24.0');
      setGrossWeight('25.2');
    }
  };

  const handleSave = () => {
    const net = Number.parseFloat(netWeight) || 10;
    const gross = Number.parseFloat(grossWeight) || net;
    onAdd({
      title: title.trim() || `New ${MetalVisuals[metalType].label} Heirloom`,
      metalType,
      category: DEFAULT_CATEGORY[metalType],
      purity,
      grossWeightGrams: gross,
      netMetalWeightGrams: net,
      diamondCarats: metalType === 'DIAMOND' ? Number.parseFloat(diamondCarats) || 0.5 : undefined,
      diamondClarityColor: metalType === 'DIAMOND' ? 'VVS1-EF' : undefined,
      location,
      locationDetail,
      ownerName,
      jewelerName,
      invoiceNumber: attachBill ? invoiceNumber : undefined,
      attachPhoto,
      attachBill,
    });
    setTitle('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add Precious Asset</Text>
              <Text style={styles.subtitle}>
                Auto-compresses photos (~95 KB) & bills (~150 KB WebP)
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={VaultPalette.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Metal Selector */}
            <Text style={styles.label}>Metal / Asset Type</Text>
            <View style={styles.rowWrap}>
              {METAL_TYPES.map((m) => {
                const vis = MetalVisuals[m];
                const active = metalType === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => handleSelectMetal(m)}
                    style={[
                      styles.chip,
                      active && { borderColor: vis.color, backgroundColor: vis.tint },
                    ]}
                  >
                    <Text style={[styles.chipText, active && { color: vis.color }]}>
                      {vis.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Item Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., 22K Lakshmi Coin / Silver Kudam"
                placeholderTextColor={VaultPalette.textMuted}
                style={styles.input}
              />
            </View>

            {/* Purity */}
            <Text style={styles.label}>Purity</Text>
            <View style={styles.rowWrap}>
              {DEFAULT_PURITY[metalType].map((p) => {
                const active = purity === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPurity(p)}
                    style={[
                      styles.chip,
                      active && {
                        borderColor: VaultPalette.gold,
                        backgroundColor: VaultPalette.goldTint,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, active && { color: VaultPalette.goldBright }]}>
                      {getPurityLabel(p)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Weights */}
            <View style={styles.rowTwo}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Net Metal Weight (g)</Text>
                <TextInput
                  value={netWeight}
                  onChangeText={setNetWeight}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Gross Weight (g)</Text>
                <TextInput
                  value={grossWeight}
                  onChangeText={setGrossWeight}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            {metalType === 'DIAMOND' ? (
              <View style={styles.field}>
                <Text style={styles.label}>Diamond Weight (Carats · 1 ct = 100 Cents)</Text>
                <TextInput
                  value={diamondCarats}
                  onChangeText={setDiamondCarats}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            ) : null}

            {/* Owner */}
            <Text style={styles.label}>Owner / Family Beneficiary</Text>
            <View style={styles.rowWrap}>
              {OWNERS.map((owner) => {
                const active = ownerName === owner;
                return (
                  <Pressable
                    key={owner}
                    onPress={() => setOwnerName(owner)}
                    style={[
                      styles.chip,
                      active && {
                        borderColor: VaultPalette.gold,
                        backgroundColor: VaultPalette.goldTint,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, active && { color: VaultPalette.goldBright }]}>
                      {owner}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Custody Location */}
            <Text style={styles.label}>Initial Custody Location</Text>
            <View style={styles.rowWrap}>
              {LOCATIONS.map((loc) => {
                const vis = LocationVisuals[loc];
                const active = location === loc;
                return (
                  <Pressable
                    key={loc}
                    onPress={() => setLocation(loc)}
                    style={[
                      styles.chip,
                      active && { borderColor: vis.color, backgroundColor: vis.tint },
                    ]}
                  >
                    <Text style={[styles.chipText, active && { color: vis.color }]}>
                      {vis.shortLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Location Detail</Text>
              <TextInput
                value={locationDetail}
                onChangeText={setLocationDetail}
                style={styles.input}
              />
            </View>

            {/* Compression pipeline toggles */}
            <View style={styles.toggleCard}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Attach Item Photo (1200px WebP)</Text>
                  <Text style={styles.toggleSub}>On-device resize shrinks 7 MB → ~94 KB</Text>
                </View>
                <Switch
                  value={attachPhoto}
                  onValueChange={setAttachPhoto}
                  trackColor={{ false: VaultPalette.border, true: VaultPalette.goldDim }}
                  thumbColor={attachPhoto ? VaultPalette.goldBright : VaultPalette.textMuted}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Attach GST Tax Invoice (1800px WebP)</Text>
                  <Text style={styles.toggleSub}>Legible fine print at ~152 KB for CBDT audit</Text>
                </View>
                <Switch
                  value={attachBill}
                  onValueChange={setAttachBill}
                  trackColor={{ false: VaultPalette.border, true: VaultPalette.emerald }}
                  thumbColor={attachBill ? '#ECFDF5' : VaultPalette.textMuted}
                />
              </View>
            </View>

            {attachBill ? (
              <View style={styles.rowTwo}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Jeweler</Text>
                  <TextInput
                    value={jewelerName}
                    onChangeText={setJewelerName}
                    style={styles.input}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Invoice #</Text>
                  <TextInput
                    value={invoiceNumber}
                    onChangeText={setInvoiceNumber}
                    style={styles.input}
                  />
                </View>
              </View>
            ) : null}
          </ScrollView>

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="add-circle" size={18} color="#090D0B" />
            <Text style={styles.saveBtnText}>Save to Family Vault</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: VaultPalette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: VaultPalette.borderGold,
    padding: 20,
    maxHeight: '90%',
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: VaultPalette.text,
  },
  subtitle: {
    fontSize: 12,
    color: VaultPalette.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: VaultPalette.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 12,
    paddingBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: VaultPalette.textSecondary,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    backgroundColor: VaultPalette.surfaceElevated,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: VaultPalette.textSecondary,
  },
  field: {
    gap: 6,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    backgroundColor: VaultPalette.bg,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: VaultPalette.text,
    fontSize: 14,
  },
  toggleCard: {
    backgroundColor: VaultPalette.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    padding: 12,
    gap: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: VaultPalette.text,
  },
  toggleSub: {
    fontSize: 11,
    color: VaultPalette.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: VaultPalette.border,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: VaultPalette.gold,
    borderRadius: 14,
    paddingVertical: 14,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#090D0B',
  },
});
