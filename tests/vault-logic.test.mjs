import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FAMILY_MEMBERS,
  INITIAL_BULLION_RATES,
  INITIAL_VAULT_HISTORY,
  INITIAL_VAULT_ITEMS,
} from '../src/data/mock-vault.ts';
import {
  displayINR,
  formatDateTime,
  formatDateTimeWithTime,
  formatGoldWeight,
  formatINR,
  formatINRCompact,
  formatSilverWeight,
  formatWeightForItem,
  getPurityLabel,
  MASKED_INR,
} from '../src/utils/formatters.ts';
import {
  calculateItemValuation,
  computeCbdtCoverage,
  summarizePortfolio,
} from '../src/utils/valuation.ts';
import { decryptVaultBackup, encryptVaultBackup } from '../src/utils/vault-crypto.ts';

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
    id: 'gold-necklace',
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
    id: 'gold-coin',
    title: '24K Lakshmi Coin',
    metalType: 'GOLD',
    category: 'COIN',
    purity: 'GOLD_24K',
    grossWeightGrams: 10,
    netMetalWeightGrams: 10,
    location: 'HOME_SAFE',
    ownerName: 'Wife',
    billPhotoUri: 'file:///coin-bill.pdf',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'gold-bar',
    title: '24K Gold Bar',
    metalType: 'GOLD',
    category: 'BAR',
    purity: 'GOLD_24K',
    grossWeightGrams: 20,
    netMetalWeightGrams: 20,
    location: 'BANK_LOCKER',
    ownerName: 'Daughter',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'gold-sgb',
    title: 'RBI SGB',
    metalType: 'GOLD',
    category: 'SGB',
    purity: 'GOLD_24K',
    grossWeightGrams: 40,
    netMetalWeightGrams: 40,
    location: 'BANK_LOCKER',
    ownerName: 'Son',
    billPhotoUri: 'file:///sgb-cert.pdf',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'diamond-manual',
    title: 'Solitaire Ring',
    metalType: 'DIAMOND',
    category: 'RING',
    purity: 'GOLD_18K',
    grossWeightGrams: 10,
    netMetalWeightGrams: 8,
    diamondCarats: 1.5,
    manualDiamondValue: 150000,
    location: 'GOLD_LOAN',
    loanAmount: 90000,
    ownerName: 'Wife',
    itemPhotoUri: 'file:///ring.jpg',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'diamond-carat-fallback',
    title: 'Diamond Nose Ring',
    metalType: 'DIAMOND',
    category: 'NOSE_RING',
    purity: 'GOLD_18K',
    grossWeightGrams: 2,
    netMetalWeightGrams: 1.8,
    diamondCarats: 0.5,
    location: 'DAILY_WEAR',
    ownerName: 'Daughter',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'diamond-empty',
    title: 'Diamond Studs Base',
    metalType: 'DIAMOND',
    category: 'EARRING',
    purity: 'GOLD_14K',
    grossWeightGrams: 4,
    netMetalWeightGrams: 3.5,
    location: 'BORROWED',
    ownerName: 'Daughter',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'silver-vessel',
    title: 'Silver Kudam',
    metalType: 'SILVER',
    category: 'POOJA_VESSEL',
    purity: 'SILVER_999',
    grossWeightGrams: 1350,
    netMetalWeightGrams: 1350,
    location: 'POOJA_ROOM',
    ownerName: 'Amma',
    billPhotoUri: 'file:///bill.pdf',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'platinum-ring',
    title: 'Platinum Band',
    metalType: 'PLATINUM',
    category: 'RING',
    purity: 'PLATINUM_950',
    grossWeightGrams: 12,
    netMetalWeightGrams: 12,
    location: 'DAILY_WEAR',
    ownerName: 'Son',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('Famvault valuation engine', () => {
  it('calculates cash melt vs replacement value for jewelry, bullion, and SGB', () => {
    const jewelryCash = calculateItemValuation(SAMPLE_ITEMS[0], TEST_RATES, 'CASH');
    assert.equal(jewelryCash.cashMeltValue, 48 * 7745);
    assert.equal(jewelryCash.activeValue, jewelryCash.cashMeltValue);

    const jewelryRepl = calculateItemValuation(SAMPLE_ITEMS[0], TEST_RATES, 'REPLACEMENT');
    assert.ok(Math.abs(jewelryRepl.replacementValue - 48 * 7745 * 1.12 * 1.03) < 0.01);
    assert.equal(jewelryRepl.activeValue, jewelryRepl.replacementValue);
    assert.ok(jewelryRepl.makingChargesAndGst > 0);

    const coinRepl = calculateItemValuation(SAMPLE_ITEMS[1], TEST_RATES, 'REPLACEMENT');
    assert.ok(Math.abs(coinRepl.replacementValue - 10 * 8450 * 1.02 * 1.03) < 0.01);

    const barRepl = calculateItemValuation(SAMPLE_ITEMS[2], TEST_RATES, 'REPLACEMENT');
    assert.ok(Math.abs(barRepl.replacementValue - 20 * 8450 * 1.02 * 1.03) < 0.01);

    const sgbRepl = calculateItemValuation(SAMPLE_ITEMS[3], TEST_RATES, 'REPLACEMENT');
    assert.equal(sgbRepl.replacementValue, sgbRepl.cashMeltValue);
    assert.equal(sgbRepl.makingChargesAndGst, 0);
  });

  it('handles diamond manual value, carat fallback, zero fallback, and platinum', () => {
    const manual = calculateItemValuation(SAMPLE_ITEMS[4], TEST_RATES, 'CASH');
    assert.equal(manual.metalComponentValue, 8 * 6340);
    assert.equal(manual.diamondComponentValue, 150000);
    assert.equal(manual.cashMeltValue, 8 * 6340 + 150000);

    const caratFallback = calculateItemValuation(SAMPLE_ITEMS[5], TEST_RATES, 'CASH');
    assert.equal(caratFallback.diamondComponentValue, 0.5 * 65000);

    const zeroDiamond = calculateItemValuation(SAMPLE_ITEMS[6], TEST_RATES, 'CASH');
    assert.equal(zeroDiamond.diamondComponentValue, 0);
    assert.equal(zeroDiamond.metalComponentValue, Math.round(3.5 * 4930));

    const platinum = calculateItemValuation(SAMPLE_ITEMS[8], TEST_RATES, 'CASH');
    assert.equal(platinum.cashMeltValue, 12 * 3180);
  });

  it('summarizes portfolio totals, loans, bill coverage, and metal breakdown', () => {
    const summary = summarizePortfolio(SAMPLE_ITEMS, TEST_RATES, 'CASH');
    assert.equal(summary.totalItemsCount, 9);
    assert.equal(summary.billCoveredCount, 3);
    assert.equal(summary.totalLoanPrincipal, 90000);
    assert.ok(summary.totalPurchaseCost >= 300000);
    assert.equal(summary.goldGrams, 131.3);
    assert.equal(summary.silverGrams, 1350);
    assert.equal(summary.platinumGrams, 12);
    assert.equal(summary.diamondCarats, 2.0);
    assert.ok(summary.byMetalValue.GOLD > 0);
    assert.ok(summary.byMetalValue.DIAMOND > 0);
    assert.ok(summary.byMetalValue.SILVER > 0);
    assert.ok(summary.byMetalValue.PLATINUM > 0);
  });

  it('computes CBDT safe-limit coverage, bill-backed grams, and excess alerts', () => {
    const members = [
      { name: 'Wife', cbdtCategory: 'MARRIED_WOMAN', cbdtSafeLimitGrams: 500 },
      { name: 'Daughter', cbdtCategory: 'UNMARRIED_WOMAN', cbdtSafeLimitGrams: 250 },
      { name: 'Son', cbdtCategory: 'MALE', cbdtSafeLimitGrams: 100 },
      { name: 'Joint', cbdtCategory: 'JOINT', cbdtSafeLimitGrams: 0 },
    ];
    const itemsWithExcess = [
      ...SAMPLE_ITEMS,
      {
        id: 'son-heavy-chain',
        title: 'Heavy Chain',
        metalType: 'GOLD',
        category: 'CHAIN',
        purity: 'GOLD_22K',
        grossWeightGrams: 90,
        netMetalWeightGrams: 120,
        location: 'HOME_SAFE',
        ownerName: 'Son',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const coverage = computeCbdtCoverage(itemsWithExcess, members);
    assert.equal(coverage.length, 3);

    const wife = coverage.find((c) => c.member.name === 'Wife');
    assert.equal(wife.totalGoldGrams, 66);
    assert.equal(wife.billBackedGrams, 10);
    assert.equal(wife.unbilledGrams, 56);
    assert.equal(wife.withinSafeLimit, true);

    const son = coverage.find((c) => c.member.name === 'Son');
    assert.equal(son.totalGoldGrams, 160);
    assert.equal(son.billBackedGrams, 40);
    assert.equal(son.unbilledGrams, 120);
    assert.equal(son.excessUnbilledGrams, 20);
    assert.equal(son.withinSafeLimit, false);
  });
});

describe('Famvault formatters', () => {
  it('formats and masks INR values across all magnitudes', () => {
    assert.equal(formatINR(0), '₹0');
    assert.equal(formatINR(-12500), '₹-12,500');
    assert.equal(displayINR(371760, true), MASKED_INR);
    assert.equal(displayINR(371760, false), '₹3,71,760');
    assert.equal(displayINR(250000, false, true), '₹2.50 L');

    assert.equal(formatINRCompact(12500000), '₹1.25 Cr');
    assert.equal(formatINRCompact(250000), '₹2.50 L');
    assert.equal(formatINRCompact(750), '₹750');
  });

  it('formats weights, purities, and dates accurately', () => {
    assert.equal(formatGoldWeight(16, 'PAVAN'), '2.00 Pavan');
    assert.equal(formatGoldWeight(16, 'GRAMS'), '16.0 g');
    assert.equal(formatGoldWeight(8), '8.0 g');
    assert.equal(formatSilverWeight(1350), '1.35 kg');
    assert.equal(formatSilverWeight(500), '500 g');
    assert.equal(formatWeightForItem(1350, 'SILVER', 'GRAMS'), '1.35 kg');
    assert.equal(formatWeightForItem(500, 'SILVER', 'GRAMS'), '500 g');
    assert.equal(formatWeightForItem(16, 'GOLD', 'PAVAN'), '2.00 Pavan');
    assert.equal(formatWeightForItem(12, 'PLATINUM', 'GRAMS'), '12.0 g');

    assert.equal(getPurityLabel('GOLD_24K'), '24K (999)');
    assert.equal(getPurityLabel('GOLD_22K'), '22K (916)');
    assert.equal(getPurityLabel('GOLD_18K'), '18K (750)');
    assert.equal(getPurityLabel('GOLD_14K'), '14K (585)');
    assert.equal(getPurityLabel('SILVER_999'), '999 Fine');
    assert.equal(getPurityLabel('SILVER_925'), '925 Sterling');
    assert.equal(getPurityLabel('SILVER_VESSEL_80'), '80% Vessel');
    assert.equal(getPurityLabel('PLATINUM_950'), 'Pt950');

    assert.ok(formatDateTime('2026-11-12T10:30:00Z').includes('2026'));
    assert.ok(formatDateTimeWithTime('2026-11-12T10:30:00Z').includes('2026'));
  });
});

describe('Famvault encrypted storage & .famvault backup', () => {
  const snapshot = {
    version: 1,
    savedAt: '2026-11-12T10:00:00Z',
    items: SAMPLE_ITEMS,
    history: INITIAL_VAULT_HISTORY,
    rates: TEST_RATES,
    members: FAMILY_MEMBERS,
    unitMode: 'GRAMS',
    valuationMode: 'CASH',
    hidePrices: false,
    compactMode: true,
    accentTheme: 'ROSE_GOLD',
    biometricEnabled: true,
    lastBackupAt: '2026-11-12T10:00:00Z',
    isProUnlocked: true,
    vaultPin: '492817',
    sharedMembers: [{ id: 'sh-1', name: 'Wife', contact: 'wife@family.in', role: 'EDITOR' }],
  };

  it('encrypts without leaking plaintext and round-trips with correct PIN', () => {
    const encrypted = encryptVaultBackup(snapshot, '492817');
    assert.ok(!encrypted.includes('22K Haram'));
    assert.ok(!encrypted.includes('492817'));

    const parsed = JSON.parse(encrypted);
    assert.equal(parsed.format, 'FAMVAULT_ENCRYPTED_V1');

    const restored = decryptVaultBackup(encrypted, '492817');
    assert.equal(restored.items.length, SAMPLE_ITEMS.length);
    assert.equal(restored.items[6].location, 'BORROWED');
    assert.equal(restored.vaultPin, '492817');
    assert.equal(restored.sharedMembers[0].name, 'Wife');
  });

  it('rejects wrong PIN, invalid JSON, unsupported format, tampered data, and incomplete records', () => {
    const encrypted = encryptVaultBackup(snapshot, '492817');

    assert.throws(() => decryptVaultBackup(encrypted, '123456'), /Incorrect 6-digit Vault PIN/);
    assert.throws(() => decryptVaultBackup('not-json', '492817'), /Invalid encrypted vault/);
    assert.throws(
      () => decryptVaultBackup(JSON.stringify({ format: 'OTHER' }), '492817'),
      /Unsupported Famvault/,
    );

    const parsed = JSON.parse(encrypted);
    parsed.checksum = '00000000';
    assert.throws(
      () => decryptVaultBackup(JSON.stringify(parsed), '492817'),
      /Incorrect 6-digit Vault PIN/,
    );

    const badPayload = encryptVaultBackup({ ...snapshot, items: null }, '492817');
    assert.throws(() => decryptVaultBackup(badPayload, '492817'), /missing required records/);
  });
});

describe('Famvault initial seed data integrity', () => {
  it('validates all mock vault items, members, and positive valuations', () => {
    assert.ok(INITIAL_VAULT_ITEMS.length >= 6);
    assert.ok(FAMILY_MEMBERS.length >= 4);
    for (const item of INITIAL_VAULT_ITEMS) {
      const val = calculateItemValuation(item, INITIAL_BULLION_RATES, 'CASH');
      assert.ok(val.cashMeltValue > 0, `Expected positive value for ${item.title}`);
    }
  });
});
