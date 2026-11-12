import type { BullionRatesPerGram, FamilyMember, ValuationMode, VaultItem } from '@/types/vault';

export interface ItemValuation {
  cashMeltValue: number;
  replacementValue: number;
  activeValue: number;
  metalComponentValue: number;
  diamondComponentValue: number;
  makingChargesAndGst: number;
}

export function calculateItemValuation(
  item: VaultItem,
  rates: BullionRatesPerGram,
  mode: ValuationMode = 'CASH',
): ItemValuation {
  const rate = rates[item.purity] ?? 0;
  const metalComponentValue = item.netMetalWeightGrams * rate;
  const diamondComponentValue =
    item.manualDiamondValue ?? (item.diamondCarats ? item.diamondCarats * 65000 : 0);

  const cashMeltValue = metalComponentValue + diamondComponentValue;

  // SGB and Bullion Coins don't carry 12% ornament making charges
  const isBullion =
    item.category === 'COIN_BAR' || item.category === 'COIN' || item.category === 'BAR';
  const makingFactor = item.category === 'SGB' ? 0 : isBullion ? 0.02 : 0.12;
  const gstFactor = item.category === 'SGB' ? 0 : 0.03;

  const withMaking = cashMeltValue * (1 + makingFactor);
  const replacementValue = withMaking * (1 + gstFactor);
  const makingChargesAndGst = replacementValue - cashMeltValue;

  return {
    cashMeltValue,
    replacementValue,
    activeValue: mode === 'CASH' ? cashMeltValue : replacementValue,
    metalComponentValue,
    diamondComponentValue,
    makingChargesAndGst,
  };
}

export interface PortfolioSummary {
  totalCashValue: number;
  totalReplacementValue: number;
  totalActiveValue: number;
  totalPurchaseCost: number;
  totalLoanPrincipal: number;
  goldGrams: number;
  silverGrams: number;
  diamondCarats: number;
  platinumGrams: number;
  billCoveredCount: number;
  totalItemsCount: number;
  byMetalValue: Record<'GOLD' | 'SILVER' | 'DIAMOND' | 'PLATINUM', number>;
}

export function summarizePortfolio(
  items: VaultItem[],
  rates: BullionRatesPerGram,
  mode: ValuationMode,
): PortfolioSummary {
  let totalCashValue = 0;
  let totalReplacementValue = 0;
  let totalPurchaseCost = 0;
  let totalLoanPrincipal = 0;
  let goldGrams = 0;
  let silverGrams = 0;
  let diamondCarats = 0;
  let platinumGrams = 0;
  let billCoveredCount = 0;

  const byMetalValue = {
    GOLD: 0,
    SILVER: 0,
    DIAMOND: 0,
    PLATINUM: 0,
  };

  for (const item of items) {
    const val = calculateItemValuation(item, rates, mode);
    totalCashValue += val.cashMeltValue;
    totalReplacementValue += val.replacementValue;
    totalPurchaseCost += item.purchasePrice ?? val.cashMeltValue;

    if (item.location === 'GOLD_LOAN' && item.loanAmount) {
      totalLoanPrincipal += item.loanAmount;
    }

    if (item.billPhotoUri) {
      billCoveredCount += 1;
    }

    byMetalValue[item.metalType] += val.activeValue;

    if (item.metalType === 'GOLD') {
      goldGrams += item.netMetalWeightGrams;
    } else if (item.metalType === 'SILVER') {
      silverGrams += item.netMetalWeightGrams;
    } else if (item.metalType === 'PLATINUM') {
      platinumGrams += item.netMetalWeightGrams;
    } else if (item.metalType === 'DIAMOND') {
      diamondCarats += item.diamondCarats ?? 0;
      // Diamond jewelry also has an 18K/14K gold base in weight
      goldGrams += item.netMetalWeightGrams;
    }
  }

  return {
    totalCashValue,
    totalReplacementValue,
    totalActiveValue: mode === 'CASH' ? totalCashValue : totalReplacementValue,
    totalPurchaseCost,
    totalLoanPrincipal,
    goldGrams,
    silverGrams,
    diamondCarats,
    platinumGrams,
    billCoveredCount,
    totalItemsCount: items.length,
    byMetalValue,
  };
}

export interface MemberCbdtCoverage {
  member: FamilyMember;
  totalGoldGrams: number;
  billBackedGrams: number;
  unbilledGrams: number;
  safeLimitGrams: number;
  withinSafeLimit: boolean;
  excessUnbilledGrams: number;
}

export function computeCbdtCoverage(
  items: VaultItem[],
  members: FamilyMember[],
): MemberCbdtCoverage[] {
  return members
    .filter((m) => m.cbdtCategory !== 'JOINT')
    .map((member) => {
      const ownedGold = items.filter(
        (item) =>
          item.ownerName === member.name &&
          (item.metalType === 'GOLD' || item.metalType === 'DIAMOND'),
      );
      const totalGoldGrams = ownedGold.reduce((acc, item) => acc + item.netMetalWeightGrams, 0);
      const billBackedGrams = ownedGold
        .filter((item) => Boolean(item.billPhotoUri))
        .reduce((acc, item) => acc + item.netMetalWeightGrams, 0);
      const unbilledGrams = Math.max(0, totalGoldGrams - billBackedGrams);
      const excessUnbilledGrams = Math.max(0, unbilledGrams - member.cbdtSafeLimitGrams);

      return {
        member,
        totalGoldGrams,
        billBackedGrams,
        unbilledGrams,
        safeLimitGrams: member.cbdtSafeLimitGrams,
        withinSafeLimit: excessUnbilledGrams === 0,
        excessUnbilledGrams,
      };
    });
}
