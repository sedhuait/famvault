import { Platform } from 'react-native';

import type { CustodyLocation, MetalType } from '@/types/vault';

export const VaultPalette = {
  // Core brushed platinum surfaces
  bg: '#0B0C10',
  surface: '#14161D',
  surfaceElevated: '#1C1F28',
  surfaceGlass: 'rgba(28, 31, 40, 0.90)',
  border: '#2A2E3B',
  borderGold: 'rgba(229, 178, 166, 0.36)',

  // Platinum typography
  text: '#F4F5F7',
  textSecondary: '#B5BCC9',
  textMuted: '#7C8494',

  // Signature Rose Gold accents
  gold: '#E0A296',
  goldBright: '#F5CEC6',
  goldDim: '#9B645A',
  goldTint: 'rgba(224, 162, 150, 0.14)',

  // Platinum, Diamond & semantic tones
  emerald: '#34D399',
  emeraldTint: 'rgba(52, 211, 153, 0.14)',
  amber: '#FBBF24',
  amberTint: 'rgba(251, 191, 36, 0.15)',
  crimson: '#FB7185',
  crimsonTint: 'rgba(251, 113, 133, 0.15)',
  sky: '#93C5FD',
  skyTint: 'rgba(147, 197, 253, 0.14)',
  violet: '#C4B5FD',
  violetTint: 'rgba(196, 181, 253, 0.14)',
  silver: '#E2E8F0',
  silverTint: 'rgba(226, 232, 240, 0.14)',
  platinum: '#CBD5E1',
  platinumTint: 'rgba(203, 213, 225, 0.14)',
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
