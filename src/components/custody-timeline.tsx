import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { VaultPalette } from '@/constants/vault-theme';
import type { HistoryActionType, VaultItemHistory } from '@/types/vault';
import { formatDateTimeWithTime } from '@/utils/formatters';

const ACTION_CONFIG: Record<
  HistoryActionType,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  ITEM_CREATED: {
    label: 'Item Created',
    color: VaultPalette.gold,
    icon: 'add-circle-outline',
  },
  LOCATION_CHANGED: {
    label: 'Custody Moved',
    color: VaultPalette.emerald,
    icon: 'swap-horizontal-outline',
  },
  LOAN_PLEDGED: {
    label: 'Pledged for Gold Loan',
    color: VaultPalette.crimson,
    icon: 'alert-circle-outline',
  },
  LOAN_RELEASED: {
    label: 'Released from Gold Loan',
    color: VaultPalette.emerald,
    icon: 'checkmark-done-circle-outline',
  },
  OWNER_TRANSFERRED: {
    label: 'Ownership Transferred',
    color: VaultPalette.violet,
    icon: 'people-outline',
  },
  WEIGHT_OR_PURITY_EDITED: {
    label: 'Weight / Purity Updated',
    color: VaultPalette.amber,
    icon: 'scale-outline',
  },
  BILL_UPLOADED: {
    label: 'Bill Copy Attached',
    color: VaultPalette.sky,
    icon: 'document-text-outline',
  },
  NOTE_LOGGED: {
    label: 'Audit Note Logged',
    color: VaultPalette.textSecondary,
    icon: 'create-outline',
  },
};

export function CustodyTimeline({ entries }: { entries: VaultItemHistory[] }) {
  if (entries.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No custody events logged yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {entries.map((entry, idx) => {
        const cfg = ACTION_CONFIG[entry.actionType];
        const isLast = idx === entries.length - 1;

        return (
          <View key={entry.id} style={styles.row}>
            {/* Left timeline rail */}
            <View style={styles.railCol}>
              <View
                style={[
                  styles.nodeDot,
                  { backgroundColor: `${cfg.color}22`, borderColor: cfg.color },
                ]}
              >
                <Ionicons name={cfg.icon} size={13} color={cfg.color} />
              </View>
              {!isLast ? <View style={styles.connector} /> : null}
            </View>

            {/* Right event content */}
            <View style={[styles.eventCard, !isLast && styles.eventCardSpacing]}>
              <Text style={styles.timestamp}>{formatDateTimeWithTime(entry.timestamp)}</Text>
              <Text style={[styles.actionTitle, { color: cfg.color }]}>{cfg.label}</Text>

              {entry.previousValue || entry.newValue ? (
                <View style={styles.deltaBox}>
                  {entry.previousValue ? (
                    <Text style={styles.deltaText}>
                      <Text style={styles.deltaMuted}>{entry.previousValue}</Text>
                      <Text style={styles.deltaArrow}> → </Text>
                      <Text style={styles.deltaNew}>{entry.newValue}</Text>
                    </Text>
                  ) : (
                    <Text style={styles.deltaNew}>{entry.newValue}</Text>
                  )}
                </View>
              ) : null}

              {entry.remarks ? <Text style={styles.remarks}>“{entry.remarks}”</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingTop: 4,
  },
  emptyBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: VaultPalette.surface,
    borderWidth: 1,
    borderColor: VaultPalette.border,
  },
  emptyText: {
    fontSize: 13,
    color: VaultPalette.textMuted,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  railCol: {
    alignItems: 'center',
    width: 26,
  },
  nodeDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    width: 1.5,
    flex: 1,
    backgroundColor: VaultPalette.border,
    marginVertical: 4,
  },
  eventCard: {
    flex: 1,
    backgroundColor: VaultPalette.surface,
    borderWidth: 1,
    borderColor: VaultPalette.border,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  eventCardSpacing: {
    marginBottom: 12,
  },
  timestamp: {
    fontSize: 11,
    color: VaultPalette.textMuted,
    fontWeight: '500',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  deltaBox: {
    marginTop: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: VaultPalette.surfaceElevated,
  },
  deltaText: {
    fontSize: 12,
    lineHeight: 18,
  },
  deltaMuted: {
    color: VaultPalette.textSecondary,
  },
  deltaArrow: {
    color: VaultPalette.gold,
    fontWeight: '700',
  },
  deltaNew: {
    color: VaultPalette.text,
    fontWeight: '600',
    fontSize: 12,
  },
  remarks: {
    fontSize: 12,
    color: VaultPalette.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
