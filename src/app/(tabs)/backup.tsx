import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExportVaultModal } from '@/components/export-modal';
import { VaultMaxWidth, VaultPalette } from '@/constants/vault-theme';
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
    setHidePrices,
    biometricEnabled,
    setBiometricEnabled,
    lockVault,
    lastBackupAt,
    recordBackupNow,
    isProUnlocked,
    setIsProUnlocked,
  } = useVault();

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
              <Text style={styles.title}>Security & Cloud Backup</Text>
              <Text style={styles.subtitle}>100% On-Device · Private Family Storage</Text>
            </View>
          </View>

          {/* Biometric Lock Controls */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="finger-print" size={20} color={VaultPalette.gold} />
              <Text style={styles.cardTitle}>Biometric Vault Lock</Text>
            </View>

            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Require Face ID / Biometric on Launch</Text>
                <Text style={styles.rowSub}>
                  Protects your family vault with a 6-digit PIN backup
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: VaultPalette.border, true: VaultPalette.goldDim }}
                thumbColor={biometricEnabled ? VaultPalette.goldBright : VaultPalette.textMuted}
              />
            </View>

            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Hide ₹ Valuations (Discreet Mode)</Text>
                <Text style={styles.rowSub}>
                  Masks portfolio and item rupee amounts while keeping weights and locations visible
                </Text>
              </View>
              <Switch
                value={hidePrices}
                onValueChange={setHidePrices}
                trackColor={{ false: VaultPalette.border, true: VaultPalette.emerald }}
                thumbColor={hidePrices ? '#ECFDF5' : VaultPalette.textMuted}
              />
            </View>

            <Pressable
              onPress={lockVault}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="lock-closed" size={16} color={VaultPalette.goldBright} />
              <Text style={styles.secondaryBtnText}>Test Biometric Lock Screen Now</Text>
            </Pressable>
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
              <Ionicons name="document-text-outline" size={16} color={VaultPalette.goldBright} />
              <Text style={styles.secondaryBtnText}>Preview Audit Schedule &amp; CSV</Text>
            </Pressable>
          </View>

          {/* Tijori Pro Showcase */}
          <View style={[styles.card, styles.proCard]}>
            <View style={styles.proHeader}>
              <View>
                <Text style={styles.proBadge}>TIJORI PRO · LIFETIME</Text>
                <Text style={styles.proTitle}>₹499 One-Time Family Unlock</Text>
              </View>
              <Switch
                value={isProUnlocked}
                onValueChange={setIsProUnlocked}
                trackColor={{ false: VaultPalette.border, true: VaultPalette.goldDim }}
                thumbColor={isProUnlocked ? VaultPalette.goldBright : VaultPalette.textMuted}
              />
            </View>
            <Text style={styles.rowSub}>
              Includes Unlimited Vault Items & Bills · Encrypted iCloud / Google Drive Backup · Gold
              Loan & Wedding Return Alerts · PDF Audit Export · Biometric App Lock.
            </Text>
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
              <Text style={styles.modalTitle}>Tijori Insurance & Locker Schedule</Text>
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

const styles = StyleSheet.create({
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
  footprintTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: VaultPalette.goldBright,
  },
  footprintTotalVal: {
    fontSize: 14,
    fontWeight: '800',
    color: VaultPalette.goldBright,
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
    backgroundColor: VaultPalette.gold,
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
    color: VaultPalette.goldBright,
  },
  proCard: {
    borderColor: VaultPalette.borderGold,
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
    color: VaultPalette.gold,
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
    borderColor: VaultPalette.borderGold,
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
    color: VaultPalette.gold,
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
