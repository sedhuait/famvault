import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { VaultPalette } from '@/constants/vault-theme';
import { useVault } from '@/context/vault-context';
import type { VaultItem } from '@/types/vault';
import {
  buildVaultCsv,
  type ExportResult,
  exportVaultCsv,
  exportVaultPdf,
} from '@/utils/export-vault';
import { displayINR } from '@/utils/formatters';
import { summarizePortfolio } from '@/utils/valuation';

interface ExportVaultModalProps {
  visible: boolean;
  onClose: () => void;
  filteredItems?: VaultItem[];
  scopeHint?: string;
}

export function ExportVaultModal({
  visible,
  onClose,
  filteredItems,
  scopeHint,
}: ExportVaultModalProps) {
  const { items, history, rates, members, valuationMode, hidePrices } = useVault();

  const hasSubset = Boolean(filteredItems && filteredItems.length !== items.length);
  const [useFiltered, setUseFiltered] = useState<boolean>(hasSubset);
  const [busyFormat, setBusyFormat] = useState<'CSV' | 'PDF' | null>(null);
  const [lastResult, setLastResult] = useState<ExportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCsvPreview, setShowCsvPreview] = useState(false);

  const exportItems = useMemo(
    () => (hasSubset && useFiltered && filteredItems ? filteredItems : items),
    [hasSubset, useFiltered, filteredItems, items],
  );

  const summary = useMemo(
    () => summarizePortfolio(exportItems, rates, valuationMode),
    [exportItems, rates, valuationMode],
  );

  const csvPreview = useMemo(
    () => buildVaultCsv(exportItems, rates).replace(/^\uFEFF/, ''),
    [exportItems, rates],
  );

  const handleExportCsv = async () => {
    setErrorMsg(null);
    setBusyFormat('CSV');
    try {
      const res = await exportVaultCsv(exportItems, rates);
      setLastResult(res);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to export CSV.');
    } finally {
      setBusyFormat(null);
    }
  };

  const handleExportPdf = async () => {
    setErrorMsg(null);
    setBusyFormat('PDF');
    try {
      const res = await exportVaultPdf({
        items: exportItems,
        history,
        rates,
        members,
        valuationMode,
        scopeLabel: hasSubset && useFiltered ? scopeHint : 'Complete Family Vault',
      });
      setLastResult(res);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to export PDF.');
    } finally {
      setBusyFormat(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Export Vault Report</Text>
              <Text style={styles.subtitle}>
                {exportItems.length} items · {displayINR(summary.totalActiveValue, hidePrices)}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={VaultPalette.textSecondary} />
            </Pressable>
          </View>

          {hasSubset && filteredItems ? (
            <View style={styles.scopeSwitch}>
              <Pressable
                onPress={() => setUseFiltered(true)}
                style={[styles.scopeChip, useFiltered && styles.scopeChipActive]}
              >
                <Text style={[styles.scopeText, useFiltered && styles.scopeTextActive]}>
                  Filtered ({filteredItems.length})
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setUseFiltered(false)}
                style={[styles.scopeChip, !useFiltered && styles.scopeChipActive]}
              >
                <Text style={[styles.scopeText, !useFiltered && styles.scopeTextActive]}>
                  Full Vault ({items.length})
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.optionsList}>
            {/* CSV Option */}
            <Pressable
              onPress={handleExportCsv}
              disabled={busyFormat !== null}
              style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
            >
              <View style={[styles.optionIcon, { backgroundColor: VaultPalette.emeraldTint }]}>
                <MaterialCommunityIcons
                  name="file-delimited-outline"
                  size={24}
                  color={VaultPalette.emerald}
                />
              </View>
              <View style={styles.optionTextCol}>
                <Text style={styles.optionTitle}>Export Spreadsheet (CSV)</Text>
                <Text style={styles.optionSub}>
                  24 columns: weights (g &amp; Pavan), purities, invoices, loans &amp; INR
                  valuations
                </Text>
              </View>
              <View style={styles.optionActionPill}>
                <Ionicons name="download-outline" size={16} color={VaultPalette.emerald} />
                <Text style={[styles.optionActionText, { color: VaultPalette.emerald }]}>
                  {busyFormat === 'CSV' ? '...' : 'CSV'}
                </Text>
              </View>
            </Pressable>

            {/* PDF Option */}
            <Pressable
              onPress={handleExportPdf}
              disabled={busyFormat !== null}
              style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
            >
              <View style={[styles.optionIcon, { backgroundColor: VaultPalette.skyTint }]}>
                <MaterialCommunityIcons name="file-pdf-box" size={26} color={VaultPalette.sky} />
              </View>
              <View style={styles.optionTextCol}>
                <Text style={styles.optionTitle}>Export Audit Schedule (PDF)</Text>
                <Text style={styles.optionSub}>
                  Printable A4 dossier with inventory, CBDT safe limits &amp; custody audit log
                </Text>
              </View>
              <View style={[styles.optionActionPill, { backgroundColor: VaultPalette.skyTint }]}>
                <Ionicons name="print-outline" size={16} color={VaultPalette.sky} />
                <Text style={[styles.optionActionText, { color: VaultPalette.sky }]}>
                  {busyFormat === 'PDF' ? '...' : 'PDF'}
                </Text>
              </View>
            </Pressable>
          </View>

          {lastResult ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={16} color={VaultPalette.emerald} />
              <Text style={styles.successText}>
                {lastResult.format === 'CSV'
                  ? Platform.OS === 'web'
                    ? `Downloaded ${lastResult.fileName}`
                    : `Ready to share ${lastResult.fileName}`
                  : Platform.OS === 'web'
                    ? 'Opened printable PDF dialog (choose Save as PDF).'
                    : `Generated PDF ${lastResult.fileName}`}
              </Text>
            </View>
          ) : null}

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          {/* Toggle inline CSV preview */}
          <Pressable
            onPress={() => setShowCsvPreview((prev) => !prev)}
            style={styles.previewToggle}
          >
            <Text style={styles.previewToggleText}>
              {showCsvPreview ? 'Hide Raw CSV Preview' : 'Preview Raw CSV Columns'}
            </Text>
            <Ionicons
              name={showCsvPreview ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={VaultPalette.gold}
            />
          </Pressable>

          {showCsvPreview ? (
            <ScrollView style={styles.csvBox} horizontal>
              <ScrollView nestedScrollEnabled>
                <Text style={styles.csvText}>{csvPreview}</Text>
              </ScrollView>
            </ScrollView>
          ) : null}
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
    maxHeight: '85%',
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
    color: VaultPalette.gold,
    fontWeight: '600',
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
  scopeSwitch: {
    flexDirection: 'row',
    gap: 8,
  },
  scopeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    backgroundColor: VaultPalette.bg,
    alignItems: 'center',
  },
  scopeChipActive: {
    borderColor: VaultPalette.borderGold,
    backgroundColor: VaultPalette.goldTint,
  },
  scopeText: {
    fontSize: 12,
    fontWeight: '600',
    color: VaultPalette.textSecondary,
  },
  scopeTextActive: {
    color: VaultPalette.goldBright,
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: VaultPalette.bg,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    borderRadius: 16,
    padding: 14,
  },
  optionCardPressed: {
    borderColor: VaultPalette.borderGold,
    backgroundColor: VaultPalette.surfaceElevated,
  },
  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextCol: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: VaultPalette.text,
  },
  optionSub: {
    fontSize: 11,
    color: VaultPalette.textSecondary,
    lineHeight: 16,
  },
  optionActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: VaultPalette.emeraldTint,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  optionActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: VaultPalette.emeraldTint,
    borderRadius: 10,
    padding: 10,
  },
  successText: {
    fontSize: 12,
    color: VaultPalette.emerald,
    fontWeight: '600',
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: VaultPalette.crimson,
  },
  previewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  previewToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: VaultPalette.gold,
  },
  csvBox: {
    maxHeight: 180,
    backgroundColor: VaultPalette.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    padding: 10,
  },
  csvText: {
    fontSize: 11,
    color: VaultPalette.textSecondary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    lineHeight: 16,
  },
});
