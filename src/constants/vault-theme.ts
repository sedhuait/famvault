import { Platform } from 'react-native';

import type { CustodyLocation, MetalType } from '@/types/vault';

export const VaultPalette = {
  // Core obsidian & emerald-tinted vault surfaces
  bg: '#080C0B',
  surface: '#101715',
  surfaceElevated: '#17211E',
  surfaceGlass: 'rgba(23, 33, 30, 0.88)',
  border: '#23312C',
  borderGold: 'rgba(218, 179, 86, 0.35)',

  // Typography
  text: '#F7F4EC',
  textSecondary: '#A8B3AD',
  textMuted: '#6D7A74',

  // Signature 24K Antique Gold
  gold: '#DFB955',
  goldBright: '#F6DF96',
  goldDim: '#8D6F28',
  goldTint: 'rgba(223, 185, 85, 0.14)',

  // Emerald trust & semantic tones
  emerald: '#10B981',
  emeraldTint: 'rgba(16, 185, 129, 0.14)',
  amber: '#F59E0B',
  amberTint: 'rgba(245, 158, 11, 0.15)',
  crimson: '#F43F5E',
  crimsonTint: 'rgba(244, 63, 94, 0.15)',
  sky: '#38BDF8',
  skyTint: 'rgba(56, 189, 248, 0.14)',
  violet: '#A78BFA',
  violetTint: 'rgba(167, 139, 250, 0.14)',
  silver: '#CBD5E1',
  silverTint: 'rgba(203, 213, 225, 0.14)',
  platinum: '#94A3B8',
  platinumTint: 'rgba(148, 163, 184, 0.14)',
} as const;

export const MetalVisuals: Record<
  MetalType,
  { label: string; color: string; tint: string; icon: string }
> = {
  GOLD: {
    label: 'Gold',
    color: VaultPalette.gold,
    tint: VaultPalette.goldTint,
    icon: 'crown-outline',
  },
  SILVER: {
    label: 'Silver',
    color: VaultPalette.silver,
    tint: VaultPalette.silverTint,
    icon: 'silverware-variant',
  },
  DIAMOND: {
    label: 'Diamond',
    color: VaultPalette.sky,
    tint: VaultPalette.skyTint,
    icon: 'diamond-stone',
  },
  PLATINUM: {
    label: 'Platinum',
    color: VaultPalette.platinum,
    tint: VaultPalette.platinumTint,
    icon: 'ring',
  },
};

export const LocationVisuals: Record<
  CustodyLocation,
  { label: string; shortLabel: string; color: string; tint: string; icon: string }
> = {
  BANK_LOCKER: {
    label: 'Bank Locker',
    shortLabel: 'Locker',
    color: VaultPalette.emerald,
    tint: VaultPalette.emeraldTint,
    icon: 'safe-square-outline',
  },
  HOME_SAFE: {
    label: 'Home Safe',
    shortLabel: 'Home Safe',
    color: VaultPalette.amber,
    tint: VaultPalette.amberTint,
    icon: 'lock-outline',
  },
  POOJA_ROOM: {
    label: 'Pooja Room',
    shortLabel: 'Pooja',
    color: '#FB923C',
    tint: 'rgba(251, 146, 60, 0.15)',
    icon: 'lamp',
  },
  GOLD_LOAN: {
    label: 'Gold Loan Pledged',
    shortLabel: 'Gold Loan',
    color: VaultPalette.crimson,
    tint: VaultPalette.crimsonTint,
    icon: 'bank-transfer',
  },
  DAILY_WEAR: {
    label: 'Daily Wear',
    shortLabel: 'Daily Wear',
    color: VaultPalette.sky,
    tint: VaultPalette.skyTint,
    icon: 'hand-heart-outline',
  },
  WITH_FAMILY: {
    label: 'With Family',
    shortLabel: 'Family',
    color: VaultPalette.violet,
    tint: VaultPalette.violetTint,
    icon: 'account-group-outline',
  },
};

export const VaultFonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    mono: 'Menlo',
  },
  android: {
    sans: 'sans-serif',
    serif: 'serif',
    mono: 'monospace',
  },
  default: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    serif: 'Georgia, serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
});

export const VaultMaxWidth = 860;
