import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { LocationVisuals } from '@/constants/vault-theme';
import type {
  BullionRatesPerGram,
  FamilyMember,
  ValuationMode,
  VaultItem,
  VaultItemHistory,
} from '@/types/vault';
import {
  formatDateTimeWithTime,
  formatINR,
  GRAMS_PER_PAVAN,
  getPurityLabel,
} from '@/utils/formatters';
import { calculateItemValuation, computeCbdtCoverage, summarizePortfolio } from '@/utils/valuation';

function csvEscape(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeHtml(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildVaultCsv(items: VaultItem[], rates: BullionRatesPerGram): string {
  const headers = [
    'ID',
    'Title',
    'Metal Type',
    'Category',
    'Purity',
    'Gross Weight (g)',
    'Net Metal Weight (g)',
    'Pavan (8g)',
    'Diamond (ct)',
    'Certificate #',
    'Owner',
    'Custody Location',
    'Location Detail',
    'Gold Loan Principal (INR)',
    'Loan Lender',
    'Loan Interest (%)',
    'Jeweler',
    'Invoice Number',
    'GST Bill Attached',
    'Purchase Price (INR)',
    'Cash Melt Value (INR)',
    'Store Replacement Value (INR)',
    'Notes',
    'Last Updated',
  ];

  const rows = items.map((item) => {
    const val = calculateItemValuation(item, rates, 'CASH');
    const pavan =
      item.metalType === 'GOLD' ? (item.netMetalWeightGrams / GRAMS_PER_PAVAN).toFixed(2) : '';

    return [
      item.id,
      item.title,
      item.metalType,
      item.category,
      getPurityLabel(item.purity),
      item.grossWeightGrams.toFixed(2),
      item.netMetalWeightGrams.toFixed(2),
      pavan,
      item.diamondCarats ? item.diamondCarats.toFixed(2) : '',
      item.certNumber ?? '',
      item.ownerName,
      LocationVisuals[item.location].label,
      item.locationDetail ?? '',
      item.loanAmount ?? '',
      item.loanLender ?? '',
      item.loanInterestRate ?? '',
      item.jewelerName ?? '',
      item.invoiceNumber ?? '',
      item.billPhotoUri ? 'YES' : 'NO',
      item.purchasePrice ?? '',
      Math.round(val.cashMeltValue),
      Math.round(val.replacementValue),
      item.notes ?? '',
      item.updatedAt,
    ]
      .map(csvEscape)
      .join(',');
  });

  // UTF-8 BOM ensures Excel/Numbers renders ₹ cleanly
  return `\uFEFF${[headers.map(csvEscape).join(','), ...rows].join('\r\n')}`;
}

export function buildVaultReportHtml(params: {
  items: VaultItem[];
  history: VaultItemHistory[];
  rates: BullionRatesPerGram;
  members: FamilyMember[];
  valuationMode: ValuationMode;
  scopeLabel?: string;
}): string {
  const { items, history, rates, members, valuationMode, scopeLabel } = params;
  const summary = summarizePortfolio(items, rates, valuationMode);
  const cbdtRows = computeCbdtCoverage(items, members);
  const generatedAt = formatDateTimeWithTime(new Date().toISOString());

  const itemRowsHtml = items
    .map((item) => {
      const val = calculateItemValuation(item, rates, valuationMode);
      const weightText =
        item.metalType === 'SILVER' && item.netMetalWeightGrams >= 1000
          ? `${(item.netMetalWeightGrams / 1000).toFixed(2)} kg`
          : `${item.netMetalWeightGrams.toFixed(1)} g`;
      const diamondNote = item.diamondCarats
        ? `<br/><span class="muted">${item.diamondCarats.toFixed(2)} ct (${escapeHtml(item.diamondClarityColor ?? '')})</span>`
        : '';
      const billText = item.billPhotoUri
        ? `<span class="badge-ok">Verified (${escapeHtml(item.invoiceNumber ?? 'Invoice')})</span>`
        : '<span class="badge-warn">No Bill</span>';

      return `
        <tr>
          <td><strong>${escapeHtml(item.title)}</strong>${diamondNote}<br/><span class="muted">${escapeHtml(item.jewelerName ?? '')}</span></td>
          <td>${escapeHtml(item.metalType)} · ${escapeHtml(getPurityLabel(item.purity))}<br/><span class="muted">Net ${escapeHtml(weightText)}</span></td>
          <td>${escapeHtml(item.ownerName)}</td>
          <td>${escapeHtml(LocationVisuals[item.location].label)}<br/><span class="muted">${escapeHtml(item.locationDetail ?? '')}</span></td>
          <td>${billText}</td>
          <td class="num">${escapeHtml(formatINR(val.cashMeltValue))}</td>
          <td class="num"><strong>${escapeHtml(formatINR(val.replacementValue))}</strong></td>
        </tr>
      `;
    })
    .join('');

  const cbdtRowsHtml = cbdtRows
    .map(
      (row) => `
      <tr>
        <td><strong>${escapeHtml(row.member.name)}</strong></td>
        <td class="num">${row.safeLimitGrams} g</td>
        <td class="num">${row.totalGoldGrams.toFixed(1)} g</td>
        <td class="num">${row.billBackedGrams.toFixed(1)} g</td>
        <td class="num">${row.unbilledGrams.toFixed(1)} g</td>
        <td>${row.withinSafeLimit ? '<span class="badge-ok">Within Safe Limit</span>' : `<span class="badge-warn">Exceeds by ${row.excessUnbilledGrams.toFixed(1)}g</span>`}</td>
      </tr>
    `,
    )
    .join('');

  const recentHistoryHtml = history
    .slice(0, 12)
    .map((entry) => {
      const target = items.find((i) => i.id === entry.itemId);
      return `
        <tr>
          <td>${escapeHtml(formatDateTimeWithTime(entry.timestamp))}</td>
          <td>${escapeHtml(target?.title ?? entry.itemId)}</td>
          <td>${escapeHtml(entry.actionType.replace(/_/g, ' '))}</td>
          <td>${escapeHtml(entry.previousValue ? `${entry.previousValue} → ${entry.newValue ?? ''}` : (entry.newValue ?? ''))}</td>
          <td>${escapeHtml(entry.remarks ?? '')}</td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Famvault Family Audit Report</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      margin: 0;
      padding: 20px;
      font-size: 11px;
      line-height: 1.45;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid #b87b72;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand { font-size: 22px; font-weight: 800; letter-spacing: 0.8px; color: #111827; margin: 0; }
    .subtitle { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .meta { text-align: right; font-size: 10px; color: #4b5563; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .stat-box {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px;
      background: #faf6f5;
    }
    .stat-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }
    .stat-val { font-size: 14px; font-weight: 800; color: #111827; margin-top: 3px; }
    h2 {
      font-size: 13px;
      margin: 18px 0 8px;
      color: #111827;
      border-left: 3px solid #b87b72;
      padding-left: 8px;
    }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-size: 10px; text-transform: uppercase; color: #374151; }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .muted { color: #6b7280; font-size: 9.5px; }
    .badge-ok { color: #065f46; background: #d1fae5; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 9.5px; display: inline-block; }
    .badge-warn { color: #92400e; background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 9.5px; display: inline-block; }
    .footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 9.5px; color: #6b7280; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand">Famvault</h1>
      <div class="subtitle">Family Precious Metals, Insurance &amp; Bank Locker Audit Schedule${scopeLabel ? ` · ${escapeHtml(scopeLabel)}` : ''}</div>
    </div>
    <div class="meta">
      <div><strong>Generated:</strong> ${escapeHtml(generatedAt)}</div>
      <div><strong>Assets Covered:</strong> ${items.length} items · ${summary.billCoveredCount} GST bills</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="stat-box">
      <div class="stat-label">Cash Melt Value</div>
      <div class="stat-val">${escapeHtml(formatINR(summary.totalCashValue))}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Store Replacement</div>
      <div class="stat-val">${escapeHtml(formatINR(summary.totalReplacementValue))}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Gold Loan Pledged</div>
      <div class="stat-val">${escapeHtml(formatINR(summary.totalLoanPrincipal))}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Metal Holdings</div>
      <div class="stat-val">${summary.goldGrams.toFixed(1)}g Au · ${(summary.silverGrams / 1000).toFixed(2)}kg Ag</div>
    </div>
  </div>

  <h2>1. Asset &amp; Custody Inventory</h2>
  <table>
    <thead>
      <tr>
        <th>Item / Jeweler</th>
        <th>Metal &amp; Net Weight</th>
        <th>Owner</th>
        <th>Current Custody</th>
        <th>Invoice Status</th>
        <th class="num">Cash Melt (₹)</th>
        <th class="num">Replacement (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${itemRowsHtml}
    </tbody>
  </table>

  <h2>2. CBDT Tax Safe-Limit &amp; GST Bill Coverage</h2>
  <table>
    <thead>
      <tr>
        <th>Family Member</th>
        <th class="num">CBDT Safe Limit</th>
        <th class="num">Total Gold</th>
        <th class="num">Bill-Backed</th>
        <th class="num">Unbilled</th>
        <th>Audit Status</th>
      </tr>
    </thead>
    <tbody>
      ${cbdtRowsHtml}
    </tbody>
  </table>

  <h2>3. Recent Custody &amp; Movement Audit Trail</h2>
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Item</th>
        <th>Event</th>
        <th>Change</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${recentHistoryHtml}
    </tbody>
  </table>

  <div class="footer">
    <span>Famvault · 100% On-Device Private Storage</span>
    <span>24K ₹${rates.GOLD_24K.toLocaleString('en-IN')}/g · 22K ₹${rates.GOLD_22K.toLocaleString('en-IN')}/g · Silver ₹${rates.SILVER_999}/g</span>
  </div>
</body>
</html>`;
}

export interface ExportResult {
  format: 'CSV' | 'PDF';
  fileName: string;
  method: 'WEB_DOWNLOAD' | 'WEB_PRINT' | 'NATIVE_SHARE';
}

export async function exportVaultCsv(
  items: VaultItem[],
  rates: BullionRatesPerGram,
): Promise<ExportResult> {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const fileName = `famvault-${dateStamp}.csv`;
  const csv = buildVaultCsv(items, rates);

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { format: 'CSV', fileName, method: 'WEB_DOWNLOAD' };
  }

  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(csv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: 'Export Famvault CSV',
    });
  }

  return { format: 'CSV', fileName, method: 'NATIVE_SHARE' };
}

export async function exportVaultPdf(params: {
  items: VaultItem[];
  history: VaultItemHistory[];
  rates: BullionRatesPerGram;
  members: FamilyMember[];
  valuationMode: ValuationMode;
  scopeLabel?: string;
}): Promise<ExportResult> {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const fileName = `famvault-audit-schedule-${dateStamp}.pdf`;
  const html = buildVaultReportHtml(params);

  if (Platform.OS === 'web') {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.srcdoc = html;
    document.body.appendChild(iframe);

    await new Promise<void>((resolve) => {
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 1500);
          resolve();
        }
      };
    });

    return { format: 'PDF', fileName, method: 'WEB_PRINT' };
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: '.pdf',
      dialogTitle: 'Export Famvault Audit PDF',
    });
  }

  return { format: 'PDF', fileName, method: 'NATIVE_SHARE' };
}
