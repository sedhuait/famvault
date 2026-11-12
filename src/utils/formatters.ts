import type { Purity, WeightUnitMode } from '@/types/vault';

export const GRAMS_PER_PAVAN = 8;
export const MASKED_INR = '₹ ••••••';

/**
 * Formats an INR amount using Indian numbering separators (e.g. ₹12,48,500).
 */
export function formatINR(amount: number): string {
  const rounded = Math.round(amount);
  return `₹${rounded.toLocaleString('en-IN')}`;
}

/**
 * Formats an INR amount concisely in Lakhs (L) or Crores (Cr).
 */
export function formatINRCompact(amount: number): string {
  if (amount >= 1_00_00_000) {
    return `₹${(amount / 1_00_00_000).toFixed(2)} Cr`;
  }
  if (amount >= 1_00_000) {
    return `₹${(amount / 1_00_000).toFixed(2)} L`;
  }
  return formatINR(amount);
}

/**
 * Formats or masks an INR amount when discreet "Hide Prices" mode is enabled.
 */
export function displayINR(amount: number, hidePrices: boolean, compact = false): string {
  if (hidePrices) return MASKED_INR;
  return compact ? formatINRCompact(amount) : formatINR(amount);
}

/**
 * Formats gold weight in Grams or Pavans/Sovereigns (1 Pavan = 8g).
 */
export function formatGoldWeight(grams: number, mode: WeightUnitMode = 'GRAMS'): string {
  if (mode === 'PAVAN') {
    const pavans = grams / GRAMS_PER_PAVAN;
    return `${pavans.toFixed(2)} Pavan`;
  }
  return `${grams.toFixed(1)} g`;
}

/**
 * Formats silver weight automatically in kg when >= 1,000g.
 */
export function formatSilverWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`;
  }
  return `${grams.toFixed(0)} g`;
}

export function formatWeightForItem(
  grams: number,
  metalType: 'GOLD' | 'SILVER' | 'DIAMOND' | 'PLATINUM',
  unitMode: WeightUnitMode,
): string {
  if (metalType === 'SILVER') {
    return formatSilverWeight(grams);
  }
  if (metalType === 'GOLD') {
    return formatGoldWeight(grams, unitMode);
  }
  return `${grams.toFixed(1)} g`;
}

export function getPurityLabel(purity: Purity): string {
  const map: Record<Purity, string> = {
    GOLD_24K: '24K (999)',
    GOLD_22K: '22K (916)',
    GOLD_18K: '18K (750)',
    GOLD_14K: '14K (585)',
    SILVER_999: '999 Fine',
    SILVER_925: '925 Sterling',
    SILVER_VESSEL_80: '80% Vessel',
    PLATINUM_950: 'Pt950',
  };
  return map[purity];
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeWithTime(isoString: string): string {
  const date = new Date(isoString);
  const datePart = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} • ${timePart}`;
}
