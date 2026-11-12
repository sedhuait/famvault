import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  displayINR,
  formatGoldWeight,
  formatWeightForItem,
  MASKED_INR,
} from '../src/utils/formatters.ts';
import {
  calculateItemValuation,
  computeCbdtCoverage,
  summarizePortfolio,
} from '../src/utils/valuation.ts';

const TEST_RATES = {
  GOLD_24K: 8450,
  GOLD_22K: 7745,
  GOLD_18K: 6340,
  GOLD_14K: 4930,
  SILVER_999: 104,
  SILVER_925: 96.2,
  SILVER_VESSEL_80: 83.2,
  PLATINUM_950: 3180,
};

const SAMPLE_ITEMS = [
  {
    id: 'gold-1',
    title: '22K Haram',
    metalType: 'GOLD',
    category: 'NECKLACE',
    purity: 'GOLD_22K',
    grossWeightGrams: 50,
    netMetalWeightGrams: 48,
    location: 'BANK_LOCKER',
    ownerName: 'Wife',
    purchasePrice: 300000,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'silver-1',
    title: 'Silver Kudam',
    metalType: 'SILVER',
    category: 'POOJA_VESSEL',
    purity: 'SILVER_999',
    grossWeightGrams: 500,
    netMetalWeightGrams: 500,
    location: 'POOJA_ROOM',
    ownerName: 'Amma',
    billPhotoUri: 'file:///bill.pdf',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('Famvault valuation & formatting', () => {
  it('calculates cash melt vs replacement value accurately', () => {
    const cash = calculateItemValuation(SAMPLE_ITEMS[0], TEST_RATES, 'CASH');
    assert.equal(cash.cashMeltValue, 48 * 7745);
    assert.equal(cash.activeValue, cash.cashMeltValue);

    const replacement = calculateItemValuation(SAMPLE_ITEMS[0], TEST_RATES, 'REPLACEMENT');
    assert.ok(replacement.replacementValue > cash.cashMeltValue);
    assert.equal(replacement.activeValue, replacement.replacementValue);
  });

  it('summarizes portfolio totals and bill coverage', () => {
    const summary = summarizePortfolio(SAMPLE_ITEMS, TEST_RATES, 'CASH');
    assert.equal(summary.totalItemsCount, 2);
    assert.equal(summary.billCoveredCount, 1);
    assert.equal(summary.goldGrams, 48);
    assert.equal(summary.silverGrams, 500);
    assert.equal(summary.totalActiveValue, 48 * 7745 + 500 * 104);
  });

  it('computes CBDT safe-limit coverage per member', () => {
    const members = [
      { name: 'Wife', cbdtCategory: 'MARRIED_WOMAN', cbdtSafeLimitGrams: 500 },
      { name: 'Son', cbdtCategory: 'MALE', cbdtSafeLimitGrams: 100 },
    ];
    const coverage = computeCbdtCoverage(SAMPLE_ITEMS, members);
    assert.equal(coverage[0].totalGoldGrams, 48);
    assert.equal(coverage[0].billBackedGrams, 0);
    assert.equal(coverage[1].totalGoldGrams, 0);
  });

  it('masks INR prices in discreet mode and formats weights', () => {
    assert.equal(displayINR(371760, true), MASKED_INR);
    assert.equal(displayINR(371760, false), '₹3,71,760');
    assert.equal(formatGoldWeight(16, 'PAVAN'), '2.00 Pavan');
    assert.equal(formatWeightForItem(500, 'SILVER', 'GRAMS'), '500 g');
  });
});
