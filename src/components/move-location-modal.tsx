import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  LocationDetailConfig,
  LocationVisuals,
  VaultPalette,
  type VaultPaletteType,
} from '@/constants/vault-theme';
import { type MoveLocationPayload, useVaultPalette } from '@/context/vault-context';
import type { CustodyLocation, VaultItem } from '@/types/vault';

const LOCATIONS: CustodyLocation[] = [
  'BANK_LOCKER',
  'HOME_SAFE',
  'POOJA_ROOM',
  'GOLD_LOAN',
  'DAILY_WEAR',
  'WITH_FAMILY',
  'BORROWED',
];

interface MoveLocationModalProps {
  visible: boolean;
  item: VaultItem;
  onClose: () => void;
  onSubmit: (payload: MoveLocationPayload) => void;
}

export function MoveLocationModal({ visible, item, onClose, onSubmit }: MoveLocationModalProps) {
  const palette = useVaultPalette();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [selectedLoc, setSelectedLoc] = useState<CustodyLocation>(item.location);
  const [detail, setDetail] = useState<string>(item.locationDetail ?? '');
  const [remarks, setRemarks] = useState<string>('');
  const [loanLender, setLoanLender] = useState<string>(item.loanLender ?? 'Muthoot Finance');
  const [loanAmount, setLoanAmount] = useState<string>(
    item.loanAmount ? String(item.loanAmount) : '200000',
  );
  const [loanRate, setLoanRate] = useState<string>(
    item.loanInterestRate ? String(item.loanInterestRate) : '9.5',
  );

  useEffect(() => {
    if (visible) {
      setSelectedLoc(item.location);
      setDetail(item.locationDetail ?? '');
      setRemarks('');
    }
  }, [visible, item]);

  const handleConfirm = () => {
    onSubmit({
      itemId: item.id,
      nextLocation: selectedLoc,
      locationDetail: detail,
      remarks:
        remarks ||
        (selectedLoc === 'GOLD_LOAN'
          ? `Pledged with ${loanLender}`
          : `Moved to ${LocationVisuals[selectedLoc].label}`),
      loanAmount: selectedLoc === 'GOLD_LOAN' ? Number(loanAmount) || 0 : undefined,
      loanLender: selectedLoc === 'GOLD_LOAN' ? loanLender : undefined,
      loanInterestRate: selectedLoc === 'GOLD_LOAN' ? Number(loanRate) || 9.5 : undefined,
      loanMaturityDate: selectedLoc === 'GOLD_LOAN' ? '2027-06-15T00:00:00Z' : undefined,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Quick Move Custody</Text>
              <Text style={styles.sheetSubtitle}>{item.title}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={VaultPalette.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>Select New Custody Location</Text>
            <View style={styles.locGrid}>
              {LOCATIONS.map((loc) => {
                const vis = LocationVisuals[loc];
                const active = selectedLoc === loc;
                return (
                  <Pressable
                    key={loc}
                    onPress={() => {
                      setSelectedLoc(loc);
                      if (loc === item.location && item.locationDetail) {
                        setDetail(item.locationDetail);
                      } else {
                        setDetail(LocationDetailConfig[loc].presets[0]);
                      }
                    }}
                    style={[
                      styles.locChip,
                      active && {
                        borderColor: vis.color,
                        backgroundColor: vis.tint,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={vis.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={16}
                      color={active ? vis.color : VaultPalette.textSecondary}
                    />
                    <Text
                      style={[
                        styles.locChipText,
                        active && { color: vis.color, fontWeight: '700' },
                      ]}
                    >
                      {vis.shortLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{LocationDetailConfig[selectedLoc].label}</Text>
              <View style={styles.locGrid}>
                {LocationDetailConfig[selectedLoc].presets.map((preset) => {
                  const active = detail === preset;
                  const vis = LocationVisuals[selectedLoc];
                  return (
                    <Pressable
                      key={preset}
                      onPress={() => setDetail(preset)}
                      style={[
                        styles.presetChip,
                        active && { borderColor: vis.color, backgroundColor: vis.tint },
                      ]}
                    >
                      <Text style={[styles.presetText, active && { color: vis.color }]}>
                        {preset}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                value={detail}
                onChangeText={setDetail}
                placeholder={LocationDetailConfig[selectedLoc].placeholder}
                placeholderTextColor={VaultPalette.textMuted}
                style={styles.input}
              />
            </View>

            {selectedLoc === 'GOLD_LOAN' ? (
              <View style={styles.loanSection}>
                <Text style={styles.loanHeading}>Gold Loan Pledge Details</Text>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Lender (Bank / NBFC)</Text>
                  <TextInput
                    value={loanLender}
                    onChangeText={setLoanLender}
                    placeholder="e.g., SBI / Muthoot Finance"
                    placeholderTextColor={VaultPalette.textMuted}
                    style={styles.input}
                  />
                </View>
                <View style={styles.rowTwo}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Principal (₹)</Text>
                    <TextInput
                      value={loanAmount}
                      onChangeText={setLoanAmount}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Interest (% p.a.)</Text>
                    <TextInput
                      value={loanRate}
                      onChangeText={setLoanRate}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Audit Log Remarks</Text>
              <TextInput
                value={remarks}
                onChangeText={setRemarks}
                placeholder="e.g., Taken out for cousin's wedding; returning Sunday"
                placeholderTextColor={VaultPalette.textMuted}
                multiline
                style={[styles.input, styles.textArea]}
              />
            </View>
          </ScrollView>

          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="checkmark-circle" size={18} color="#090D0B" />
            <Text style={styles.confirmBtnText}>Record Custody Movement</Text>
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
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: VaultPalette.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderColor: palette.borderGold,
      padding: 20,
      maxHeight: '88%',
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
      gap: 16,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: VaultPalette.text,
    },
    sheetSubtitle: {
      fontSize: 12,
      color: palette.gold,
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
    scrollBody: {
      gap: 14,
      paddingBottom: 8,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: VaultPalette.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    locGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    locChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      backgroundColor: VaultPalette.surfaceElevated,
    },
    presetChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      backgroundColor: VaultPalette.surfaceElevated,
    },
    presetText: {
      fontSize: 12,
      color: VaultPalette.textSecondary,
      fontWeight: '600',
    },
    locChipText: {
      fontSize: 12,
      color: VaultPalette.textSecondary,
      fontWeight: '600',
    },
    fieldGroup: {
      gap: 6,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: VaultPalette.textSecondary,
    },
    input: {
      backgroundColor: VaultPalette.bg,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 11,
      color: VaultPalette.text,
      fontSize: 14,
    },
    textArea: {
      minHeight: 72,
      textAlignVertical: 'top',
    },
    loanSection: {
      padding: 12,
      borderRadius: 14,
      backgroundColor: VaultPalette.crimsonTint,
      borderWidth: 1,
      borderColor: 'rgba(244, 63, 94, 0.35)',
      gap: 10,
    },
    loanHeading: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FDA4AF',
    },
    rowTwo: {
      flexDirection: 'row',
      gap: 10,
    },
    confirmBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: palette.gold,
      borderRadius: 14,
      paddingVertical: 14,
    },
    confirmBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#090D0B',
    },
  });
