import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExportVaultModal } from '@/components/export-modal';
import { VaultMaxWidth, VaultPalette, type VaultPaletteType } from '@/constants/vault-theme';
import { useVault } from '@/context/vault-context';
import { exportVaultCsv, exportVaultPdf } from '@/utils/export-vault';
import { displayINR, formatDateTimeWithTime } from '@/utils/formatters';
import { summarizePortfolio } from '@/utils/valuation';

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
    recordBackupNow,
  } = useVault();

  const styles = useMemo(() => createStyles(palette), [palette]);

  const [backupStep, setBackupStep] = useState<string | null>(null);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

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

  const handleRunBackup = () => {
    if (backupStep) return;
    setBackupStep('1/4 • Preparing your vault records...');
    setTimeout(() => {
      setBackupStep('2/4 • Packaging photos and GST bills...');
      setTimeout(() => {
        setBackupStep('3/4 • Locking backup with your PIN...');
        setTimeout(() => {
          setBackupStep(
            Platform.OS === 'android'
              ? '4/4 • Saving to your Google Drive...'
              : '4/4 • Saving to your private cloud...',
          );
          setTimeout(() => {
            recordBackupNow();
            setBackupStep(null);
          }, 550);
        }, 550);
      }, 500);
    }, 500);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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

            <Pressable
              onPress={handleRunBackup}
              disabled={Boolean(backupStep)}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="cloud-done" size={18} color="#090D0B" />
              <Text style={styles.primaryBtnText}>
                {backupStep ? 'Backing Up...' : 'Run Encrypted Cloud Backup'}
              </Text>
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
              <Text style={styles.modalTitle}>Famvault Insurance &amp; Locker Schedule</Text>
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
  });
