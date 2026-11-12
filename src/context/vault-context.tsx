import * as Haptics from 'expo-haptics';
import type React from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { LocationVisuals } from '@/constants/vault-theme';
import {
  FAMILY_MEMBERS,
  INITIAL_BULLION_RATES,
  INITIAL_VAULT_HISTORY,
  INITIAL_VAULT_ITEMS,
} from '@/data/mock-vault';
import type {
  BullionRatesPerGram,
  CustodyLocation,
  FamilyMember,
  HistoryActionType,
  Purity,
  ValuationMode,
  VaultItem,
  VaultItemHistory,
  WeightUnitMode,
} from '@/types/vault';
import { getPurityLabel } from '@/utils/formatters';

export interface MoveLocationPayload {
  itemId: string;
  nextLocation: CustodyLocation;
  locationDetail: string;
  remarks: string;
  loanAmount?: number;
  loanLender?: string;
  loanInterestRate?: number;
  loanMaturityDate?: string;
}

export interface AddItemPayload {
  title: string;
  metalType: VaultItem['metalType'];
  category: VaultItem['category'];
  purity: Purity;
  grossWeightGrams: number;
  netMetalWeightGrams: number;
  diamondCarats?: number;
  diamondClarityColor?: string;
  certNumber?: string;
  manualDiamondValue?: number;
  location: CustodyLocation;
  locationDetail: string;
  ownerName: string;
  jewelerName?: string;
  invoiceNumber?: string;
  purchasePrice?: number;
  attachBill?: boolean;
  attachPhoto?: boolean;
  notes?: string;
}

interface VaultContextValue {
  items: VaultItem[];
  history: VaultItemHistory[];
  rates: BullionRatesPerGram;
  members: FamilyMember[];
  unitMode: WeightUnitMode;
  valuationMode: ValuationMode;
  hidePrices: boolean;
  isUnlocked: boolean;
  biometricEnabled: boolean;
  lastBackupAt: string;
  isProUnlocked: boolean;
  setUnitMode: (mode: WeightUnitMode) => void;
  toggleUnitMode: () => void;
  setValuationMode: (mode: ValuationMode) => void;
  toggleValuationMode: () => void;
  setHidePrices: (hidden: boolean) => void;
  toggleHidePrices: () => void;
  unlockVault: () => void;
  lockVault: () => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setIsProUnlocked: (enabled: boolean) => void;
  updateRate: (purity: Purity, nextRate: number) => void;
  moveItemLocation: (payload: MoveLocationPayload) => void;
  transferItemOwner: (itemId: string, nextOwner: string, remarks: string) => void;
  attachBillToItem: (itemId: string, jewelerName: string, invoiceNumber: string) => void;
  addVaultItem: (payload: AddItemPayload) => VaultItem;
  recordBackupNow: () => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

function triggerHaptic(type: 'light' | 'success' = 'light') {
  if (Platform.OS === 'web') return;
  if (type === 'success') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } else {
    Haptics.selectionAsync().catch(() => {});
  }
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<VaultItem[]>(INITIAL_VAULT_ITEMS);
  const [history, setHistory] = useState<VaultItemHistory[]>(INITIAL_VAULT_HISTORY);
  const [rates, setRates] = useState<BullionRatesPerGram>(INITIAL_BULLION_RATES);
  const [unitMode, setUnitMode] = useState<WeightUnitMode>('GRAMS');
  const [valuationMode, setValuationMode] = useState<ValuationMode>('CASH');
  const [hidePrices, setHidePrices] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(true);
  const [lastBackupAt, setLastBackupAt] = useState<string>('2026-11-12T05:15:00Z');
  const [isProUnlocked, setIsProUnlocked] = useState<boolean>(true);

  const toggleUnitMode = useCallback(() => {
    triggerHaptic('light');
    setUnitMode((prev) => (prev === 'GRAMS' ? 'PAVAN' : 'GRAMS'));
  }, []);

  const toggleValuationMode = useCallback(() => {
    triggerHaptic('light');
    setValuationMode((prev) => (prev === 'CASH' ? 'REPLACEMENT' : 'CASH'));
  }, []);

  const toggleHidePrices = useCallback(() => {
    triggerHaptic('light');
    setHidePrices((prev) => !prev);
  }, []);

  const unlockVault = useCallback(() => {
    triggerHaptic('success');
    setIsUnlocked(true);
  }, []);

  const lockVault = useCallback(() => {
    triggerHaptic('light');
    setIsUnlocked(false);
  }, []);

  const updateRate = useCallback((purity: Purity, nextRate: number) => {
    setRates((prev) => ({ ...prev, [purity]: nextRate }));
  }, []);

  const moveItemLocation = useCallback(
    ({
      itemId,
      nextLocation,
      locationDetail,
      remarks,
      loanAmount,
      loanLender,
      loanInterestRate,
      loanMaturityDate,
    }: MoveLocationPayload) => {
      const now = new Date().toISOString();
      const target = items.find((i) => i.id === itemId);
      if (!target) return;

      let actionType: HistoryActionType = 'LOCATION_CHANGED';
      if (nextLocation === 'GOLD_LOAN') actionType = 'LOAN_PLEDGED';
      if (target.location === 'GOLD_LOAN' && nextLocation !== 'GOLD_LOAN') {
        actionType = 'LOAN_RELEASED';
      }

      const prevLabel = `${LocationVisuals[target.location].label}${
        target.locationDetail ? ` (${target.locationDetail})` : ''
      }`;
      const newLabel =
        nextLocation === 'GOLD_LOAN' && loanAmount
          ? `Gold Loan (${loanLender || 'Lender'} • ₹${loanAmount.toLocaleString('en-IN')}${
              loanInterestRate ? ` @ ${loanInterestRate}%` : ''
            })`
          : `${LocationVisuals[nextLocation].label}${locationDetail ? ` (${locationDetail})` : ''}`;

      const entry: VaultItemHistory = {
        id: `hist-${Date.now()}`,
        itemId,
        actionType,
        fieldChanged: 'location',
        previousValue: prevLabel,
        newValue: newLabel,
        metadataJson: loanAmount ? JSON.stringify({ loanAmount, lender: loanLender }) : undefined,
        remarks: remarks.trim() || undefined,
        timestamp: now,
      };

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            location: nextLocation,
            locationDetail: locationDetail.trim() || undefined,
            loanAmount: nextLocation === 'GOLD_LOAN' ? loanAmount : undefined,
            loanLender: nextLocation === 'GOLD_LOAN' ? loanLender : undefined,
            loanInterestRate: nextLocation === 'GOLD_LOAN' ? loanInterestRate : undefined,
            loanMaturityDate: nextLocation === 'GOLD_LOAN' ? loanMaturityDate : undefined,
            updatedAt: now,
          };
        }),
      );
      setHistory((prev) => [entry, ...prev]);
      triggerHaptic('success');
    },
    [items],
  );

  const transferItemOwner = useCallback(
    (itemId: string, nextOwner: string, remarks: string) => {
      const now = new Date().toISOString();
      const target = items.find((i) => i.id === itemId);
      if (!target || target.ownerName === nextOwner) return;

      const entry: VaultItemHistory = {
        id: `hist-${Date.now()}`,
        itemId,
        actionType: 'OWNER_TRANSFERRED',
        fieldChanged: 'ownerName',
        previousValue: target.ownerName,
        newValue: nextOwner,
        remarks: remarks.trim() || `Ownership updated to ${nextOwner}`,
        timestamp: now,
      };

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, ownerName: nextOwner, updatedAt: now } : item,
        ),
      );
      setHistory((prev) => [entry, ...prev]);
      triggerHaptic('success');
    },
    [items],
  );

  const attachBillToItem = useCallback(
    (itemId: string, jewelerName: string, invoiceNumber: string) => {
      const now = new Date().toISOString();
      const target = items.find((i) => i.id === itemId);
      if (!target) return;

      const fileName = `${itemId}_bill_${Date.now()}.webp`;
      const entry: VaultItemHistory = {
        id: `hist-${Date.now()}`,
        itemId,
        actionType: 'BILL_UPLOADED',
        fieldChanged: 'billPhotoUri',
        previousValue: target.billPhotoUri ? 'Previous Bill Replaced' : 'None',
        newValue: fileName,
        remarks: `Attached GST invoice (${jewelerName} • ${invoiceNumber}).`,
        timestamp: now,
      };

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                billPhotoUri: fileName,
                compressedBillKb: 148,
                jewelerName: jewelerName.trim() || item.jewelerName,
                invoiceNumber: invoiceNumber.trim() || item.invoiceNumber,
                updatedAt: now,
              }
            : item,
        ),
      );
      setHistory((prev) => [entry, ...prev]);
      triggerHaptic('success');
    },
    [items],
  );

  const addVaultItem = useCallback((payload: AddItemPayload): VaultItem => {
    const now = new Date().toISOString();
    const id = `item-${Date.now()}`;
    const newItem: VaultItem = {
      id,
      title: payload.title.trim(),
      metalType: payload.metalType,
      category: payload.category,
      purity: payload.purity,
      grossWeightGrams: payload.grossWeightGrams,
      netMetalWeightGrams: payload.netMetalWeightGrams,
      diamondCarats: payload.diamondCarats,
      diamondClarityColor: payload.diamondClarityColor,
      certNumber: payload.certNumber,
      manualDiamondValue: payload.manualDiamondValue,
      location: payload.location,
      locationDetail: payload.locationDetail.trim() || undefined,
      ownerName: payload.ownerName,
      itemPhotoUri: payload.attachPhoto ? `${id}_photo.webp` : undefined,
      billPhotoUri: payload.attachBill ? `${id}_bill.webp` : undefined,
      compressedPhotoKb: payload.attachPhoto ? 94 : undefined,
      compressedBillKb: payload.attachBill ? 152 : undefined,
      jewelerName: payload.jewelerName?.trim() || undefined,
      invoiceNumber: payload.invoiceNumber?.trim() || undefined,
      purchasePrice: payload.purchasePrice,
      notes: payload.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const createdLog: VaultItemHistory = {
      id: `hist-${Date.now()}`,
      itemId: id,
      actionType: 'ITEM_CREATED',
      fieldChanged: 'created',
      newValue: `${payload.netMetalWeightGrams}g (${getPurityLabel(payload.purity)}) • Owner: ${payload.ownerName}`,
      remarks: payload.attachBill
        ? 'Added item with GST invoice copy.'
        : 'Added item to family vault.',
      timestamp: now,
    };

    setItems((prev) => [newItem, ...prev]);
    setHistory((prev) => [createdLog, ...prev]);
    triggerHaptic('success');
    return newItem;
  }, []);

  const recordBackupNow = useCallback(() => {
    triggerHaptic('success');
    setLastBackupAt(new Date().toISOString());
  }, []);

  const value = useMemo<VaultContextValue>(
    () => ({
      items,
      history,
      rates,
      members: FAMILY_MEMBERS,
      unitMode,
      valuationMode,
      hidePrices,
      isUnlocked,
      biometricEnabled,
      lastBackupAt,
      isProUnlocked,
      setUnitMode,
      toggleUnitMode,
      setValuationMode,
      toggleValuationMode,
      setHidePrices,
      toggleHidePrices,
      unlockVault,
      lockVault,
      setBiometricEnabled,
      setIsProUnlocked,
      updateRate,
      moveItemLocation,
      transferItemOwner,
      attachBillToItem,
      addVaultItem,
      recordBackupNow,
    }),
    [
      items,
      history,
      rates,
      unitMode,
      valuationMode,
      hidePrices,
      isUnlocked,
      biometricEnabled,
      lastBackupAt,
      isProUnlocked,
      toggleUnitMode,
      toggleValuationMode,
      toggleHidePrices,
      unlockVault,
      lockVault,
      updateRate,
      moveItemLocation,
      transferItemOwner,
      attachBillToItem,
      addVaultItem,
      recordBackupNow,
    ],
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultContextValue {
  const ctx = useContext(VaultContext);
  if (!ctx) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return ctx;
}
