import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExportVaultModal } from '@/components/export-modal';
import { VaultMaxWidth, VaultPalette, type VaultPaletteType } from '@/constants/vault-theme';
import { useVault } from '@/context/vault-context';
import { exportVaultCsv, exportVaultPdf } from '@/utils/export-vault';
import { displayINR, formatDateTimeWithTime } from '@/utils/formatters';
import { summarizePortfolio } from '@/utils/valuation';
import { exportEncryptedBackupFile, pickAndRestoreBackupFile } from '@/utils/vault-storage';

export default function BackupAndSecurityScreen() {
  const {
    items,
    history,
    rates,
    members,
    valuationMode,
    hidePrices,
    palette,
    lastBackupAt,
    vaultPin,
    sharedMembers,
    recordBackupNow,
    addSharedMember,
    removeSharedMember,
    createVaultSnapshot,
    restoreVaultSnapshot,
  } = useVault();

  const styles = useMemo(() => createStyles(palette), [palette]);

  const [backupStep, setBackupStep] = useState<string | null>(null);
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [shareProvider, setShareProvider] = useState<'GDRIVE' | 'ICLOUD'>(
    Platform.OS === 'ios' ? 'ICLOUD' : 'GDRIVE',
  );
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteContact, setInviteContact] = useState('');
  const [inviteRole, setInviteRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');

  const storageMath = useMemo(() => {
    const photosKb = items.reduce((acc, i) => acc + (i.compressedPhotoKb ?? 0), 0);
    const billsKb = items.reduce((acc, i) => acc + (i.compressedBillKb ?? 0), 0);
    const dbKb = 180 + history.length * 2;
    const totalMb = (photosKb + billsKb + dbKb) / 1024;
    return { photosKb, billsKb, dbKb, totalMb };
  }, [items, history]);

  const summary = useMemo(
    () => summarizePortfolio(items, rates, valuationMode),
    [items, rates, valuationMode],
  );

  const handleRunBackup = async () => {
    if (backupStep) return;
    setBackupError(null);
    setBackupFeedback(null);
    const providerLabel = shareProvider === 'ICLOUD' ? 'iCloud Drive' : 'Google Drive';
    try {
      setBackupStep('1/3 • Encrypting vault with your PIN...');
      const snapshot = createVaultSnapshot();
      setBackupStep(`2/3 • Preparing encrypted backup for ${providerLabel}...`);
      const res = await exportEncryptedBackupFile(snapshot, vaultPin, providerLabel);
      setBackupStep('3/3 • Finalizing backup...');
      recordBackupNow();
      setBackupFeedback(
        res.method === 'WEB_DOWNLOAD'
          ? `Downloaded encrypted backup: ${res.fileName}`
          : `Ready to save ${res.fileName} to ${providerLabel}`,
      );
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Unable to create backup file.');
    } finally {
      setBackupStep(null);
    }
  };

  const handleRestoreBackup = async () => {
    if (backupStep) return;
    setBackupError(null);
    setBackupFeedback(null);
    try {
      setBackupStep('Selecting & decrypting backup...');
      const { fileName, snapshot } = await pickAndRestoreBackupFile(vaultPin);
      restoreVaultSnapshot(snapshot);
      setBackupFeedback(`Restored ${snapshot.items.length} items from ${fileName}`);
    } catch (err) {
      if (err instanceof Error && err.message === 'CANCELLED') {
        return;
      }
      setBackupError(err instanceof Error ? err.message : 'Unable to restore backup file.');
    } finally {
      setBackupStep(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Cloud Backup & Export</Text>
              <Text style={styles.subtitle}>100% On-Device · Private Family Storage</Text>
            </View>
          </View>

          {/* Cloud Backup Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cloud-upload-outline" size={20} color={VaultPalette.emerald} />
              <Text style={styles.cardTitle}>
                {Platform.OS === 'android'
                  ? 'Google Drive Backup'
                  : 'iCloud Drive & Google Drive Sync'}
              </Text>
            </View>

            <Text style={styles.backupTimestamp}>
              Last private backup: {formatDateTimeWithTime(lastBackupAt)}
            </Text>

            {/* Storage Footprint Breakdown */}
            <View style={styles.footprintBox}>
              <View style={styles.footprintRow}>
                <Text style={styles.footprintLabel}>Jewelry Photos (Space-Saved)</Text>
                <Text style={styles.footprintVal}>
                  {(storageMath.photosKb / 1024).toFixed(2)} MB
                </Text>
              </View>
              <View style={styles.footprintRow}>
                <Text style={styles.footprintLabel}>GST Invoices &amp; Bills (Space-Saved)</Text>
                <Text style={styles.footprintVal}>
                  {(storageMath.billsKb / 1024).toFixed(2)} MB
                </Text>
              </View>
              <View style={styles.footprintRow}>
                <Text style={styles.footprintLabel}>
                  Vault Records ({items.length} items, {history.length} history logs)
                </Text>
                <Text style={styles.footprintVal}>{storageMath.dbKb} KB</Text>
              </View>
              <View style={[styles.footprintRow, styles.footprintTotal]}>
                <Text style={styles.footprintTotalLabel}>Total Backup Size</Text>
                <Text style={styles.footprintTotalVal}>{storageMath.totalMb.toFixed(2)} MB</Text>
              </View>
            </View>

            {backupStep ? (
              <View style={styles.progressBanner}>
                <Ionicons name="sync" size={16} color={VaultPalette.emerald} />
                <Text style={styles.progressText}>{backupStep}</Text>
              </View>
            ) : null}

            {backupFeedback ? (
              <View style={styles.progressBanner}>
                <Ionicons name="checkmark-circle" size={16} color={VaultPalette.emerald} />
                <Text style={styles.progressText}>{backupFeedback}</Text>
              </View>
            ) : null}

            {backupError ? (
              <View
                style={[
                  styles.progressBanner,
                  {
                    backgroundColor: VaultPalette.crimsonTint,
                    borderColor: 'rgba(239, 68, 68, 0.35)',
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={16} color={VaultPalette.crimson} />
                <Text style={[styles.progressText, { color: VaultPalette.crimson }]}>
                  {backupError}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleRunBackup}
              disabled={Boolean(backupStep)}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="cloud-done" size={18} color="#090D0B" />
              <Text style={styles.primaryBtnText}>
                {backupStep
                  ? 'Backing Up...'
                  : `Save Encrypted Backup (${shareProvider === 'ICLOUD' ? 'iCloud' : 'Drive'})`}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleRestoreBackup}
              disabled={Boolean(backupStep)}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="cloud-download-outline" size={16} color={palette.goldBright} />
              <Text style={styles.secondaryBtnText}>Restore from iCloud / Google Drive</Text>
            </Pressable>
          </View>

          {/* Shared Family Folder Sync */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.cardHeader}>
                <Ionicons name="people-outline" size={20} color={palette.gold} />
                <Text style={styles.cardTitle}>Shared Family Folder</Text>
              </View>
              <View style={styles.encryptedPill}>
                <Ionicons name="lock-closed" size={11} color={VaultPalette.emerald} />
                <Text style={styles.encryptedPillText}>PIN-Encrypted</Text>
              </View>
            </View>

            <View style={styles.segmentRow}>
              <Pressable
                onPress={() => setShareProvider('GDRIVE')}
                style={[
                  styles.segmentChip,
                  shareProvider === 'GDRIVE' && {
                    borderColor: palette.gold,
                    backgroundColor: palette.goldTint,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    shareProvider === 'GDRIVE' && { color: palette.goldBright },
                  ]}
                >
                  Google Drive (iOS & Android)
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShareProvider('ICLOUD')}
                style={[
                  styles.segmentChip,
                  shareProvider === 'ICLOUD' && {
                    borderColor: palette.gold,
                    backgroundColor: palette.goldTint,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    shareProvider === 'ICLOUD' && { color: palette.goldBright },
                  ]}
                >
                  iCloud Drive (iOS)
                </Text>
              </Pressable>
            </View>

            <View style={styles.footprintBox}>
              <View style={styles.footprintRow}>
                <Text style={styles.footprintLabel}>Folder</Text>
                <Text style={styles.footprintVal}>GoldFile Family</Text>
              </View>
              <View style={styles.footprintRow}>
                <Text style={styles.footprintLabel}>Conflict Mode</Text>
                <Text style={styles.footprintVal}>Append-Only Sync</Text>
              </View>
            </View>

            {sharedMembers.map((m) => (
              <View key={m.id} style={styles.sharedMemberRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{m.name}</Text>
                  <Text style={styles.rowSub}>{m.contact}</Text>
                </View>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>
                    {m.role === 'EDITOR' ? 'Editor' : 'View-Only'}
                  </Text>
                </View>
                <Pressable onPress={() => removeSharedMember(m.id)} hitSlop={8}>
                  <Ionicons name="close-circle-outline" size={18} color={VaultPalette.textMuted} />
                </Pressable>
              </View>
            ))}

            <Pressable
              onPress={() => setInviteOpen(true)}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="person-add-outline" size={16} color={palette.goldBright} />
              <Text style={styles.secondaryBtnText}>Invite Family Member</Text>
            </Pressable>
          </View>

          {/* Export Reports (CSV & PDF) */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="file-export-outline"
                size={22}
                color={VaultPalette.sky}
              />
              <Text style={styles.cardTitle}>Export Vault Reports (CSV &amp; PDF)</Text>
            </View>
            <Text style={styles.rowSub}>
              Download a full spreadsheet (CSV) for CA/tax records or generate a printable A4
              insurance &amp; bank locker audit dossier (PDF).
            </Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={async () => {
                  const res = await exportVaultCsv(items, rates);
                  setExportFeedback(
                    Platform.OS === 'web'
                      ? `Downloaded ${res.fileName}`
                      : `Exported ${res.fileName}`,
                  );
                }}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  { flex: 1, borderColor: 'rgba(16, 185, 129, 0.4)' },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <MaterialCommunityIcons
                  name="file-delimited-outline"
                  size={17}
                  color={VaultPalette.emerald}
                />
                <Text style={[styles.secondaryBtnText, { color: VaultPalette.emerald }]}>
                  Export CSV
                </Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  const res = await exportVaultPdf({
                    items,
                    history,
                    rates,
                    members,
                    valuationMode,
                  });
                  setExportFeedback(
                    Platform.OS === 'web' ? 'Opened PDF print dialog' : `Generated ${res.fileName}`,
                  );
                }}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  { flex: 1, borderColor: 'rgba(56, 189, 248, 0.4)' },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <MaterialCommunityIcons name="file-pdf-box" size={18} color={VaultPalette.sky} />
                <Text style={[styles.secondaryBtnText, { color: VaultPalette.sky }]}>
                  Export PDF
                </Text>
              </Pressable>
            </View>

            {exportFeedback ? (
              <View style={styles.progressBanner}>
                <Ionicons name="checkmark-circle" size={16} color={VaultPalette.emerald} />
                <Text style={styles.progressText}>{exportFeedback}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => setPdfModalVisible(true)}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="document-text-outline" size={16} color={palette.goldBright} />
              <Text style={styles.secondaryBtnText}>Preview Audit Schedule &amp; CSV</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* PDF Preview Modal */}
      <Modal
        visible={pdfModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPdfModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>GoldFile Insurance &amp; Locker Schedule</Text>
              <Pressable onPress={() => setPdfModalVisible(false)}>
                <Ionicons name="close" size={22} color={VaultPalette.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.modalMeta}>
              Generated {formatDateTimeWithTime(new Date().toISOString())} · {items.length} Assets ·
              Total {displayINR(summary.totalActiveValue, hidePrices)}
            </Text>

            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 8 }}>
              {items.map((item) => (
                <View key={item.id} style={styles.pdfRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pdfItemName}>{item.title}</Text>
                    <Text style={styles.pdfItemMeta}>
                      Owner: {item.ownerName} · {item.netMetalWeightGrams}g ·{' '}
                      {item.locationDetail ?? item.location}
                    </Text>
                  </View>
                  <Text style={styles.pdfBillTag}>
                    {item.billPhotoUri ? 'GST Bill ✓' : 'No Bill'}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => {
                  setPdfModalVisible(false);
                  setExportModalVisible(true);
                }}
                style={[styles.primaryBtn, { flex: 1 }]}
              >
                <Ionicons name="download-outline" size={16} color="#090D0B" />
                <Text style={styles.primaryBtnText}>Export CSV / PDF</Text>
              </Pressable>
              <Pressable
                onPress={() => setPdfModalVisible(false)}
                style={[styles.secondaryBtn, { flex: 1 }]}
              >
                <Text style={styles.secondaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ExportVaultModal visible={exportModalVisible} onClose={() => setExportModalVisible(false)} />

      {/* Invite Family Member Modal */}
      <Modal
        visible={inviteOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setInviteOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite to Shared Folder</Text>
              <Pressable onPress={() => setInviteOpen(false)}>
                <Ionicons name="close" size={22} color={VaultPalette.textSecondary} />
              </Pressable>
            </View>
            <TextInput
              value={inviteName}
              onChangeText={setInviteName}
              placeholder="Name (e.g., Arjun, Appa)"
              placeholderTextColor={VaultPalette.textMuted}
              style={styles.textInput}
            />
            <TextInput
              value={inviteContact}
              onChangeText={setInviteContact}
              placeholder={
                shareProvider === 'GDRIVE'
                  ? 'Google email (e.g., name@gmail.com)'
                  : 'Apple ID email'
              }
              placeholderTextColor={VaultPalette.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.textInput}
            />
            <View style={styles.segmentRow}>
              {(['VIEWER', 'EDITOR'] as const).map((r) => {
                const active = inviteRole === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setInviteRole(r)}
                    style={[
                      styles.segmentChip,
                      active && {
                        borderColor: palette.gold,
                        backgroundColor: palette.goldTint,
                      },
                    ]}
                  >
                    <Text style={[styles.segmentText, active && { color: palette.goldBright }]}>
                      {r === 'EDITOR' ? 'Editor' : 'View-Only'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => {
                if (!inviteName.trim() || !inviteContact.trim()) return;
                addSharedMember({
                  name: inviteName.trim(),
                  contact: inviteContact.trim(),
                  role: inviteRole,
                });
                setInviteName('');
                setInviteContact('');
                setInviteOpen(false);
              }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Share Folder Access</Text>
            </Pressable>
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
      lineHeight: 18,
    },
    backupTimestamp: {
      fontSize: 12,
      color: VaultPalette.emerald,
      fontWeight: '600',
    },
    footprintBox: {
      backgroundColor: VaultPalette.bg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      padding: 12,
      gap: 7,
    },
    footprintRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    footprintLabel: {
      fontSize: 12,
      color: VaultPalette.textSecondary,
      flex: 1,
    },
    footprintVal: {
      fontSize: 12,
      fontWeight: '600',
      color: VaultPalette.text,
      fontVariant: ['tabular-nums'],
    },
    footprintTotal: {
      marginTop: 4,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: VaultPalette.border,
    },
    themeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    themeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      backgroundColor: VaultPalette.bg,
    },
    themeSwatch: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    themeChipText: {
      fontSize: 13,
      fontWeight: '700',
      color: VaultPalette.textSecondary,
    },
    footprintTotalLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: palette.goldBright,
    },
    footprintTotalVal: {
      fontSize: 14,
      fontWeight: '800',
      color: palette.goldBright,
    },
    progressBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: VaultPalette.emeraldTint,
      padding: 10,
      borderRadius: 10,
    },
    progressText: {
      fontSize: 12,
      color: VaultPalette.emerald,
      fontWeight: '600',
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: palette.gold,
      borderRadius: 12,
      paddingVertical: 13,
    },
    primaryBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#090D0B',
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
    proHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
      justifyContent: 'center',
      padding: 18,
    },
    modalCard: {
      backgroundColor: VaultPalette.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.borderGold,
      padding: 18,
      gap: 12,
      maxWidth: 560,
      width: '100%',
      alignSelf: 'center',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: VaultPalette.text,
    },
    modalMeta: {
      fontSize: 12,
      color: palette.gold,
      fontWeight: '600',
    },
    pdfRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: VaultPalette.bg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      padding: 10,
    },
    pdfItemName: {
      fontSize: 13,
      fontWeight: '700',
      color: VaultPalette.text,
    },
    pdfItemMeta: {
      fontSize: 11,
      color: VaultPalette.textSecondary,
      marginTop: 2,
    },
    pdfBillTag: {
      fontSize: 11,
      fontWeight: '700',
      color: VaultPalette.emerald,
    },
    encryptedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: VaultPalette.emeraldTint,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    encryptedPillText: {
      fontSize: 10,
      fontWeight: '700',
      color: VaultPalette.emerald,
    },
    segmentRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    segmentChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      backgroundColor: VaultPalette.bg,
    },
    segmentText: {
      fontSize: 12,
      fontWeight: '600',
      color: VaultPalette.textSecondary,
    },
    sharedMemberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: VaultPalette.bg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    rolePill: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: palette.goldTint,
      borderWidth: 1,
      borderColor: palette.borderGold,
    },
    rolePillText: {
      fontSize: 11,
      fontWeight: '700',
      color: palette.goldBright,
    },
    textInput: {
      backgroundColor: VaultPalette.bg,
      borderWidth: 1,
      borderColor: VaultPalette.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: VaultPalette.text,
      fontSize: 14,
    },
  });
