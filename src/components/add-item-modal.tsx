import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  CategoryVisuals,
  LocationVisuals,
  MetalVisuals,
  VaultPalette,
  type VaultPaletteType,
} from '@/constants/vault-theme';
import { type AddItemPayload, useVault } from '@/context/vault-context';
import type { CustodyLocation, ItemCategory, MetalType, Purity } from '@/types/vault';
import { getPurityLabel } from '@/utils/formatters';
import { type PickedMediaAsset, pickImageAsset, pickInvoiceDocument } from '@/utils/media-picker';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (payload: AddItemPayload) => void;
}

const METAL_TYPES: MetalType[] = ['GOLD', 'SILVER', 'DIAMOND', 'PLATINUM'];
const ITEM_CATEGORIES: ItemCategory[] = [
  'NECKLACE',
  'CHAIN',
  'PENDANT',
  'RING',
  'NOSE_RING',
  'EARRING',
  'BANGLE',
  'KOLUSU',
  'OTTIYANAM',
  'NETTI_CHUTTI',
  'COIN',
  'BAR',
  'POOJA_VESSEL',
  'SILVER_UTENSIL',
  'OTHER',
];
const LOCATIONS: CustodyLocation[] = [
  'BANK_LOCKER',
  'HOME_SAFE',
  'POOJA_ROOM',
  'DAILY_WEAR',
  'BORROWED',
];
const LOCATION_DETAIL_PRESETS = ['SBI Locker', 'HDFC Locker', 'Home Safe', 'Pooja Shelf'];
const NOTE_PRESETS = ['Heirloom', 'Wedding Gift', '916 Hallmarked', 'Insured'];
const JEWELER_PRESETS = ['GRT Jewellers', 'Tanishq', 'Malabar Gold', 'Kalyan Jewellers'];

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
  const { members, palette } = useVault();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [title, setTitle] = useState('');
  const [metalType, setMetalType] = useState<MetalType>('GOLD');
  const [category, setCategory] = useState<ItemCategory>('NECKLACE');
  const [purity, setPurity] = useState<Purity>('GOLD_22K');
  const [netWeight, setNetWeight] = useState('24.0');
  const [grossWeight, setGrossWeight] = useState('25.2');
  const [diamondCarats, setDiamondCarats] = useState('0.65');
  const [location, setLocation] = useState<CustodyLocation>('BANK_LOCKER');
  const [locationDetail, setLocationDetail] = useState('SBI Anna Nagar #42');
  const [ownerName, setOwnerName] = useState('Wife');
  const [jewelerName, setJewelerName] = useState('GRT Jewellers');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-4102');
  const [notes, setNotes] = useState('');

  const [pickedPhoto, setPickedPhoto] = useState<PickedMediaAsset | null>(null);
  const [pickedInvoice, setPickedInvoice] = useState<PickedMediaAsset | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSelectMetal = (m: MetalType) => {
    setMetalType(m);
    setCategory(DEFAULT_CATEGORY[m]);
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

  const handlePickPhoto = async (source: 'camera' | 'gallery') => {
    setUploadError(null);
    try {
      const asset = await pickImageAsset(source);
      if (asset) setPickedPhoto(asset);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to select photo.');
    }
  };

  const handlePickInvoiceImage = async () => {
    setUploadError(null);
    try {
      const asset = await pickImageAsset('gallery');
      if (asset) setPickedInvoice(asset);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to select invoice photo.');
    }
  };

  const handlePickInvoicePdf = async () => {
    setUploadError(null);
    try {
      const asset = await pickInvoiceDocument();
      if (asset) setPickedInvoice(asset);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to select invoice file.');
    }
  };

  const handleSave = () => {
    const net = Number.parseFloat(netWeight) || 10;
    const gross = Number.parseFloat(grossWeight) || net;
    onAdd({
      title:
        title.trim() || `${MetalVisuals[metalType].label} ${CategoryVisuals[category].shortLabel}`,
      metalType,
      category,
      purity,
      grossWeightGrams: gross,
      netMetalWeightGrams: net,
      diamondCarats: metalType === 'DIAMOND' ? Number.parseFloat(diamondCarats) || 0.5 : undefined,
      diamondClarityColor: metalType === 'DIAMOND' ? 'VVS1-EF' : undefined,
      location,
      locationDetail,
      ownerName,
      jewelerName,
      invoiceNumber: pickedInvoice ? invoiceNumber : undefined,
      itemPhotoUri: pickedPhoto?.uri,
      billPhotoUri: pickedInvoice?.uri,
      billFileName: pickedInvoice?.name,
      billMimeType: pickedInvoice?.mimeType,
      attachPhoto: Boolean(pickedPhoto),
      attachBill: Boolean(pickedInvoice),
      notes,
    });
    setTitle('');
    setNotes('');
    setPickedPhoto(null);
    setPickedInvoice(null);
    setUploadError(null);
    onClose();
  };

  const isInvoicePdf =
    pickedInvoice?.mimeType === 'application/pdf' ||
    pickedInvoice?.name.toLowerCase().endsWith('.pdf');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Add Precious Asset</Text>
              <Text style={styles.subtitle}>
                100% On-Device · Upload jewel photo &amp; bill (Image or PDF)
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={VaultPalette.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
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
                      styles.iconChip,
                      active && { borderColor: vis.color, backgroundColor: vis.tint },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={vis.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={15}
                      color={active ? vis.color : VaultPalette.textSecondary}
                    />
                    <Text style={[styles.chipText, active && { color: vis.color }]}>
                      {vis.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Jewelry / Item Type Selector */}
            <Text style={styles.label}>Item / Jewelry Type</Text>
            <View style={styles.rowWrap}>
              {ITEM_CATEGORIES.map((cat) => {
                const vis = CategoryVisuals[cat];
                const metalVis = MetalVisuals[metalType];
                const active = category === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.chip,
                      styles.iconChip,
                      active && { borderColor: metalVis.color, backgroundColor: metalVis.tint },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={vis.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={15}
                      color={active ? metalVis.color : VaultPalette.textSecondary}
                    />
                    <Text style={[styles.chipText, active && { color: metalVis.color }]}>
                      {vis.shortLabel}
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
                        borderColor: palette.gold,
                        backgroundColor: palette.goldTint,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, active && { color: palette.goldBright }]}>
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
              {members.map((member) => {
                const owner = member.name;
                const active = ownerName === owner;
                return (
                  <Pressable
                    key={owner}
                    onPress={() => setOwnerName(owner)}
                    style={[
                      styles.chip,
                      active && {
                        borderColor: palette.gold,
                        backgroundColor: palette.goldTint,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, active && { color: palette.goldBright }]}>
                      {owner}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Custody Location */}
            <Text style={styles.label}>Location</Text>
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
              <View style={styles.rowWrap}>
                {LOCATION_DETAIL_PRESETS.map((preset) => {
                  const active = locationDetail === preset;
                  return (
                    <Pressable
                      key={preset}
                      onPress={() => setLocationDetail(preset)}
                      style={[
                        styles.chip,
                        active && {
                          borderColor: palette.gold,
                          backgroundColor: palette.goldTint,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, active && { color: palette.goldBright }]}>
                        {preset}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                value={locationDetail}
                onChangeText={setLocationDetail}
                placeholder="Or type custom location..."
                placeholderTextColor={VaultPalette.textMuted}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Notes</Text>
              <View style={styles.rowWrap}>
                {NOTE_PRESETS.map((tag) => {
                  const active = notes.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() =>
                        setNotes((prev) =>
                          prev.includes(tag) ? prev : prev.trim() ? `${prev.trim()} · ${tag}` : tag,
                        )
                      }
                      style={[
                        styles.chip,
                        active && {
                          borderColor: palette.gold,
                          backgroundColor: palette.goldTint,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, active && { color: palette.goldBright }]}>
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Tap a tag above or add note..."
                placeholderTextColor={VaultPalette.textMuted}
                multiline
                style={[styles.input, { minHeight: 58, textAlignVertical: 'top' }]}
              />
            </View>

            {/* Real Upload: Jewelry Photo */}
            <View style={styles.uploadCard}>
              <View style={styles.uploadHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadTitle}>Jewelry Photo</Text>
                  <Text style={styles.uploadSub}>
                    Upload a clear photo of the ornament (saved 100% on-device)
                  </Text>
                </View>
              </View>

              {pickedPhoto ? (
                <View style={styles.previewRow}>
                  <Image
                    source={{ uri: pickedPhoto.uri }}
                    style={styles.thumbImg}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {pickedPhoto.name}
                    </Text>
                    <Text style={styles.fileMeta}>
                      {pickedPhoto.sizeBytes
                        ? `${Math.max(1, Math.round(pickedPhoto.sizeBytes / 1024))} KB`
                        : 'Photo attached'}
                    </Text>
                  </View>
                  <Pressable onPress={() => setPickedPhoto(null)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={16} color={VaultPalette.crimson} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.uploadBtnRow}>
                  <Pressable
                    onPress={() => handlePickPhoto('gallery')}
                    style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.8 }]}
                  >
                    <Ionicons name="images-outline" size={16} color={palette.goldBright} />
                    <Text style={styles.uploadBtnText}>Upload Jewel Pic</Text>
                  </Pressable>
                  {Platform.OS !== 'web' ? (
                    <Pressable
                      onPress={() => handlePickPhoto('camera')}
                      style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.8 }]}
                    >
                      <Ionicons name="camera-outline" size={16} color={palette.goldBright} />
                      <Text style={styles.uploadBtnText}>Camera</Text>
                    </Pressable>
                  ) : null}
                </View>
              )}
            </View>

            {/* Real Upload: GST Invoice (Image or PDF) */}
            <View style={styles.uploadCard}>
              <View style={styles.uploadHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadTitle}>GST Invoice / Certificate (Photo or PDF)</Text>
                  <Text style={styles.uploadSub}>
                    Attach a bill image or PDF document for tax &amp; insurance records
                  </Text>
                </View>
              </View>

              {pickedInvoice ? (
                <View style={styles.previewRow}>
                  {isInvoicePdf ? (
                    <View style={styles.pdfThumb}>
                      <MaterialCommunityIcons
                        name="file-pdf-box"
                        size={28}
                        color={VaultPalette.crimson}
                      />
                    </View>
                  ) : (
                    <Image
                      source={{ uri: pickedInvoice.uri }}
                      style={styles.thumbImg}
                      contentFit="cover"
                    />
                  )}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {pickedInvoice.name}
                    </Text>
                    <Text style={styles.fileMeta}>
                      {isInvoicePdf ? 'PDF Invoice' : 'Invoice Image'}
                      {pickedInvoice.sizeBytes
                        ? ` · ${Math.max(1, Math.round(pickedInvoice.sizeBytes / 1024))} KB`
                        : ''}
                    </Text>
                  </View>
                  <Pressable onPress={() => setPickedInvoice(null)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={16} color={VaultPalette.crimson} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.uploadBtnRow}>
                  <Pressable
                    onPress={handlePickInvoicePdf}
                    style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.8 }]}
                  >
                    <MaterialCommunityIcons
                      name="file-pdf-box"
                      size={17}
                      color={VaultPalette.emerald}
                    />
                    <Text style={[styles.uploadBtnText, { color: VaultPalette.emerald }]}>
                      Upload PDF / File
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handlePickInvoiceImage}
                    style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.8 }]}
                  >
                    <Ionicons name="image-outline" size={16} color={palette.goldBright} />
                    <Text style={styles.uploadBtnText}>Bill Photo</Text>
                  </Pressable>
                </View>
              )}

              {pickedInvoice ? (
                <>
                  <View style={styles.rowWrap}>
                    {JEWELER_PRESETS.map((j) => {
                      const active = jewelerName === j;
                      return (
                        <Pressable
                          key={j}
                          onPress={() => setJewelerName(j)}
                          style={[
                            styles.chip,
                            active && {
                              borderColor: palette.gold,
                              backgroundColor: palette.goldTint,
                            },
                          ]}
                        >
                          <Text style={[styles.chipText, active && { color: palette.goldBright }]}>
                            {j}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
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
                </>
              ) : null}
            </View>

            {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}
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

const createStyles = (palette: VaultPaletteType) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
      justifyContent: 'flex-end',
    },
    iconChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sheet: {
      backgroundColor: VaultPalette.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderColor: palette.borderGold,
      padding: 20,
      maxHeight: '90%',
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
      gap: 12,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
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
    scrollArea: {
      flexShrink: 1,
    },
    body: {
      gap: 12,
      paddingTop: 4,
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
    uploadCard: {
      backgroundColor: VaultPalette.bg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      padding: 12,
      gap: 10,
    },
    uploadHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    uploadTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: VaultPalette.text,
    },
    uploadSub: {
      fontSize: 11,
      color: VaultPalette.textMuted,
      marginTop: 2,
    },
    uploadBtnRow: {
      flexDirection: 'row',
      gap: 8,
    },
    uploadBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: palette.borderGold,
      backgroundColor: VaultPalette.surfaceElevated,
    },
    uploadBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: palette.goldBright,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: VaultPalette.surfaceElevated,
      borderRadius: 10,
      padding: 8,
      borderWidth: 1,
      borderColor: VaultPalette.border,
    },
    thumbImg: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: VaultPalette.surface,
    },
    pdfThumb: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: VaultPalette.crimsonTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fileName: {
      fontSize: 12,
      fontWeight: '700',
      color: VaultPalette.text,
    },
    fileMeta: {
      fontSize: 11,
      color: VaultPalette.emerald,
    },
    removeBtn: {
      padding: 6,
    },
    errorText: {
      fontSize: 12,
      color: VaultPalette.crimson,
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: palette.gold,
      borderRadius: 14,
      paddingVertical: 14,
    },
    saveBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#090D0B',
    },
  });
