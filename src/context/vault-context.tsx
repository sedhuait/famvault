import * as Haptics from 'expo-haptics';
import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';

import {
  type AccentThemeId,
  getVaultPalette,
  LocationVisuals,
  type VaultPaletteType,
} from '@/constants/vault-theme';
import {
  FAMILY_MEMBERS,
  INITIAL_BULLION_RATES,
  INITIAL_VAULT_HISTORY,
  INITIAL_VAULT_ITEMS,
} from '@/data/mock-vault';
import type {
  BullionRatesPerGram,
  CbdtCategory,
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
import {
  clearBiometricPin,
  getBiometricPin,
  hasEncryptedVault,
  type SharedFamilyMember,
  saveBiometricPin,
  saveEncryptedVaultSnapshot,
  unlockAndDecryptVault,
  type VaultSnapshot,
} from '@/utils/vault-storage';

export type VaultStatus = 'LOADING' | 'ONBOARDING' | 'LOCKED' | 'UNLOCKED';

export interface CompleteOnboardingPayload {
  pin: string;
  enableBiometric: boolean;
  includeSampleData: boolean;
  restoredSnapshot?: VaultSnapshot;
}

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
  itemPhotoUri?: string;
  billPhotoUri?: string;
  billFileName?: string;
  billMimeType?: string;
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
  compactMode: boolean;
  accentTheme: AccentThemeId;
  palette: VaultPaletteType;
  vaultStatus: VaultStatus;
  isUnlocked: boolean;
  biometricEnabled: boolean;
  lastBackupAt: string;
  isProUnlocked: boolean;
  vaultPin: string;
  sharedMembers: SharedFamilyMember[];
  setUnitMode: (mode: WeightUnitMode) => void;
  toggleUnitMode: () => void;
  setValuationMode: (mode: ValuationMode) => void;
  toggleValuationMode: () => void;
  setHidePrices: (hidden: boolean) => void;
  toggleHidePrices: () => void;
  setCompactMode: (compact: boolean) => void;
  setAccentTheme: (theme: AccentThemeId) => void;
  completeOnboarding: (payload: CompleteOnboardingPayload) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<void>;
  unlockWithBiometric: () => Promise<boolean>;
  lockVault: () => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setIsProUnlocked: (enabled: boolean) => void;
  updateRate: (purity: Purity, nextRate: number) => void;
  moveItemLocation: (payload: MoveLocationPayload) => void;
  transferItemOwner: (itemId: string, nextOwner: string, remarks: string) => void;
  attachBillToItem: (
    itemId: string,
    jewelerName: string,
    invoiceNumber: string,
    billFile?: { uri: string; name?: string; mimeType?: string },
  ) => void;
  updateItemPhoto: (itemId: string, photoUri: string) => void;
  updateItemNotes: (itemId: string, notes: string) => void;
  addVaultItem: (payload: AddItemPayload) => VaultItem;
  addFamilyMember: (name: string, cbdtCategory: Exclude<CbdtCategory, 'JOINT'>) => void;
  recordBackupNow: () => void;
  setVaultPin: (nextPin: string) => void;
  addSharedMember: (member: Omit<SharedFamilyMember, 'id'>) => void;
  removeSharedMember: (id: string) => void;
  createVaultSnapshot: () => VaultSnapshot;
  restoreVaultSnapshot: (snapshot: VaultSnapshot) => void;
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
  const [items, setItems] = useState<VaultItem[]>([]);
  const [history, setHistory] = useState<VaultItemHistory[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>(FAMILY_MEMBERS);
  const [rates, setRates] = useState<BullionRatesPerGram>(INITIAL_BULLION_RATES);
  const [unitMode, setUnitMode] = useState<WeightUnitMode>('GRAMS');
  const [valuationMode, setValuationMode] = useState<ValuationMode>('CASH');
  const [hidePrices, setHidePrices] = useState<boolean>(false);
  const [compactMode, setCompactMode] = useState<boolean>(true);
  const [accentTheme, setAccentThemeState] = useState<AccentThemeId>('ROSE_GOLD');
  const [vaultStatus, setVaultStatus] = useState<VaultStatus>('LOADING');
  const [biometricEnabled, setBiometricEnabledState] = useState<boolean>(false);
  const [lastBackupAt, setLastBackupAt] = useState<string>(new Date().toISOString());
  const [isProUnlocked, setIsProUnlocked] = useState<boolean>(true);
  const [vaultPin, setVaultPinState] = useState<string>('');
  const [sharedMembers, setSharedMembers] = useState<SharedFamilyMember[]>([
    { id: 'sh-1', name: 'Wife', contact: 'wife@family.in', role: 'EDITOR' },
  ]);
  const hydratedRef = useRef(false);

  const applySnapshot = useCallback((saved: Partial<VaultSnapshot>) => {
    if (Array.isArray(saved.items)) setItems(saved.items);
    if (Array.isArray(saved.history)) setHistory(saved.history);
    if (Array.isArray(saved.members)) setMembers(saved.members);
    if (saved.rates) setRates(saved.rates);
    if (saved.unitMode) setUnitMode(saved.unitMode);
    if (saved.valuationMode) setValuationMode(saved.valuationMode);
    if (typeof saved.hidePrices === 'boolean') setHidePrices(saved.hidePrices);
    if (typeof saved.compactMode === 'boolean') setCompactMode(saved.compactMode);
    if (saved.accentTheme) setAccentThemeState(saved.accentTheme);
    if (typeof saved.biometricEnabled === 'boolean') {
      setBiometricEnabledState(saved.biometricEnabled);
    }
    if (typeof saved.lastBackupAt === 'string') setLastBackupAt(saved.lastBackupAt);
    if (typeof saved.isProUnlocked === 'boolean') setIsProUnlocked(saved.isProUnlocked);
    if (typeof saved.vaultPin === 'string' && /^\d{6}$/.test(saved.vaultPin)) {
      setVaultPinState(saved.vaultPin);
    }
    if (Array.isArray(saved.sharedMembers)) setSharedMembers(saved.sharedMembers);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const exists = await hasEncryptedVault();
      if (!active) return;
      setVaultStatus(exists ? 'LOCKED' : 'ONBOARDING');
    })();
    return () => {
      active = false;
    };
  }, []);

  const createVaultSnapshot = useCallback(
    (): VaultSnapshot => ({
      version: 1,
      savedAt: new Date().toISOString(),
      items,
      history,
      rates,
      members,
      unitMode,
      valuationMode,
      hidePrices,
      compactMode,
      accentTheme,
      biometricEnabled,
      lastBackupAt,
      isProUnlocked,
      vaultPin,
      sharedMembers,
    }),
    [
      items,
      history,
      rates,
      members,
      unitMode,
      valuationMode,
      hidePrices,
      compactMode,
      accentTheme,
      biometricEnabled,
      lastBackupAt,
      isProUnlocked,
      vaultPin,
      sharedMembers,
    ],
  );

  useEffect(() => {
    if (!hydratedRef.current || vaultStatus !== 'UNLOCKED' || !/^\d{6}$/.test(vaultPin)) return;
    const timer = setTimeout(() => {
      void saveEncryptedVaultSnapshot(createVaultSnapshot(), vaultPin);
    }, 150);
    return () => clearTimeout(timer);
  }, [createVaultSnapshot, vaultStatus, vaultPin]);

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

  const setAccentTheme = useCallback((next: AccentThemeId) => {
    triggerHaptic('light');
    setAccentThemeState(next);
  }, []);

  const palette = useMemo(() => getVaultPalette(accentTheme), [accentTheme]);

  const completeOnboarding = useCallback(
    async ({
      pin,
      enableBiometric,
      includeSampleData,
      restoredSnapshot,
    }: CompleteOnboardingPayload) => {
      const snapshot: VaultSnapshot = restoredSnapshot
        ? {
            ...restoredSnapshot,
            vaultPin: pin,
            biometricEnabled: enableBiometric,
            savedAt: new Date().toISOString(),
          }
        : {
            version: 1,
            savedAt: new Date().toISOString(),
            items: includeSampleData ? INITIAL_VAULT_ITEMS : [],
            history: includeSampleData ? INITIAL_VAULT_HISTORY : [],
            rates: INITIAL_BULLION_RATES,
            members: FAMILY_MEMBERS,
            unitMode: 'GRAMS',
            valuationMode: 'CASH',
            hidePrices: false,
            compactMode: true,
            accentTheme: 'ROSE_GOLD',
            biometricEnabled: enableBiometric,
            lastBackupAt: new Date().toISOString(),
            isProUnlocked: true,
            vaultPin: pin,
            sharedMembers: [],
          };

      await saveEncryptedVaultSnapshot(snapshot, pin);
      if (enableBiometric) {
        await saveBiometricPin(pin);
      } else {
        await clearBiometricPin();
      }
      applySnapshot(snapshot);
      hydratedRef.current = true;
      triggerHaptic('success');
      setVaultStatus('UNLOCKED');
    },
    [applySnapshot],
  );

  const unlockWithPin = useCallback(
    async (pin: string) => {
      const decrypted = await unlockAndDecryptVault(pin);
      applySnapshot({ ...decrypted, vaultPin: pin });
      if (decrypted.biometricEnabled) {
        await saveBiometricPin(pin);
      }
      hydratedRef.current = true;
      triggerHaptic('success');
      setVaultStatus('UNLOCKED');
    },
    [applySnapshot],
  );

  const unlockWithBiometric = useCallback(async (): Promise<boolean> => {
    const pin = await getBiometricPin();
    if (!pin) return false;
    try {
      const decrypted = await unlockAndDecryptVault(pin);
      applySnapshot({ ...decrypted, vaultPin: pin });
      hydratedRef.current = true;
      triggerHaptic('success');
      setVaultStatus('UNLOCKED');
      return true;
    } catch {
      return false;
    }
  }, [applySnapshot]);

  const lockVault = useCallback(() => {
    triggerHaptic('light');
    setItems([]);
    setHistory([]);
    setVaultPinState('');
    hydratedRef.current = false;
    setVaultStatus('LOCKED');
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
    (
      itemId: string,
      jewelerName: string,
      invoiceNumber: string,
      billFile?: { uri: string; name?: string; mimeType?: string },
    ) => {
      const now = new Date().toISOString();
      const target = items.find((i) => i.id === itemId);
      if (!target) return;

      const fileUri = billFile?.uri ?? `${itemId}_bill_${Date.now()}.webp`;
      const isPdf = billFile?.mimeType === 'application/pdf';
      const entry: VaultItemHistory = {
        id: `hist-${Date.now()}`,
        itemId,
        actionType: 'BILL_UPLOADED',
        fieldChanged: 'billPhotoUri',
        previousValue: target.billPhotoUri ? 'Previous Bill Replaced' : 'None',
        newValue: billFile?.name ?? fileUri,
        remarks: `Attached ${isPdf ? 'PDF ' : ''}GST invoice (${jewelerName} • ${invoiceNumber}).`,
        timestamp: now,
      };

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                billPhotoUri: fileUri,
                billFileName: billFile?.name ?? item.billFileName,
                billMimeType: billFile?.mimeType ?? item.billMimeType,
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

  const updateItemPhoto = useCallback((itemId: string, photoUri: string) => {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              itemPhotoUri: photoUri,
              compressedPhotoKb: 96,
              updatedAt: now,
            }
          : item,
      ),
    );
    triggerHaptic('success');
  }, []);

  const updateItemNotes = useCallback(
    (itemId: string, notes: string) => {
      const now = new Date().toISOString();
      const trimmed = notes.trim();
      const target = items.find((i) => i.id === itemId);
      if (!target) return;

      const entry: VaultItemHistory = {
        id: `hist-${Date.now()}`,
        itemId,
        actionType: 'NOTE_LOGGED',
        fieldChanged: 'notes',
        previousValue: target.notes ?? 'None',
        newValue: trimmed || 'Cleared',
        remarks: trimmed || 'Note cleared',
        timestamp: now,
      };

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                notes: trimmed || undefined,
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
      itemPhotoUri: payload.itemPhotoUri ?? (payload.attachPhoto ? `${id}_photo.webp` : undefined),
      billPhotoUri: payload.billPhotoUri ?? (payload.attachBill ? `${id}_bill.webp` : undefined),
      billFileName: payload.billFileName,
      billMimeType: payload.billMimeType,
      compressedPhotoKb: payload.itemPhotoUri || payload.attachPhoto ? 94 : undefined,
      compressedBillKb: payload.billPhotoUri || payload.attachBill ? 152 : undefined,
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

  const addFamilyMember = useCallback(
    (name: string, cbdtCategory: Exclude<CbdtCategory, 'JOINT'>) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const limit =
        cbdtCategory === 'MARRIED_WOMAN' ? 500 : cbdtCategory === 'UNMARRIED_WOMAN' ? 250 : 100;
      setMembers((prev) => {
        if (prev.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) return prev;
        const joint = prev.filter((m) => m.cbdtCategory === 'JOINT');
        const others = prev.filter((m) => m.cbdtCategory !== 'JOINT');
        return [...others, { name: trimmed, cbdtCategory, cbdtSafeLimitGrams: limit }, ...joint];
      });
      triggerHaptic('success');
    },
    [],
  );

  const recordBackupNow = useCallback(() => {
    triggerHaptic('success');
    setLastBackupAt(new Date().toISOString());
  }, []);

  const setVaultPin = useCallback(
    (nextPin: string) => {
      if (!/^\d{6}$/.test(nextPin)) return;
      triggerHaptic('success');
      setVaultPinState(nextPin);
      if (biometricEnabled) {
        void saveBiometricPin(nextPin);
      }
      const nextSnapshot = { ...createVaultSnapshot(), vaultPin: nextPin };
      void saveEncryptedVaultSnapshot(nextSnapshot, nextPin);
    },
    [biometricEnabled, createVaultSnapshot],
  );

  const setBiometricEnabled = useCallback(
    (enabled: boolean) => {
      triggerHaptic('light');
      setBiometricEnabledState(enabled);
      if (enabled && /^\d{6}$/.test(vaultPin)) {
        void saveBiometricPin(vaultPin);
      } else {
        void clearBiometricPin();
      }
    },
    [vaultPin],
  );

  const addSharedMember = useCallback((member: Omit<SharedFamilyMember, 'id'>) => {
    triggerHaptic('success');
    setSharedMembers((prev) => [...prev, { ...member, id: `sh-${Date.now()}` }]);
  }, []);

  const removeSharedMember = useCallback((id: string) => {
    triggerHaptic('light');
    setSharedMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const restoreVaultSnapshot = useCallback(
    (snapshot: VaultSnapshot) => {
      const activePin = /^\d{6}$/.test(vaultPin) ? vaultPin : snapshot.vaultPin;
      const merged = { ...snapshot, vaultPin: activePin };
      applySnapshot(merged);
      triggerHaptic('success');
      if (/^\d{6}$/.test(activePin)) {
        void saveEncryptedVaultSnapshot(merged, activePin);
      }
    },
    [applySnapshot, vaultPin],
  );

  const isUnlocked = vaultStatus === 'UNLOCKED';

  const value = useMemo<VaultContextValue>(
    () => ({
      items,
      history,
      rates,
      members,
      unitMode,
      valuationMode,
      hidePrices,
      compactMode,
      accentTheme,
      palette,
      vaultStatus,
      isUnlocked,
      biometricEnabled,
      lastBackupAt,
      isProUnlocked,
      vaultPin,
      sharedMembers,
      setUnitMode,
      toggleUnitMode,
      setValuationMode,
      toggleValuationMode,
      setHidePrices,
      toggleHidePrices,
      setCompactMode,
      setAccentTheme,
      completeOnboarding,
      unlockWithPin,
      unlockWithBiometric,
      lockVault,
      setBiometricEnabled,
      setIsProUnlocked,
      updateRate,
      moveItemLocation,
      transferItemOwner,
      attachBillToItem,
      updateItemPhoto,
      updateItemNotes,
      addVaultItem,
      addFamilyMember,
      recordBackupNow,
      setVaultPin,
      addSharedMember,
      removeSharedMember,
      createVaultSnapshot,
      restoreVaultSnapshot,
    }),
    [
      items,
      history,
      rates,
      members,
      unitMode,
      valuationMode,
      hidePrices,
      compactMode,
      accentTheme,
      palette,
      vaultStatus,
      isUnlocked,
      biometricEnabled,
      lastBackupAt,
      isProUnlocked,
      vaultPin,
      sharedMembers,
      toggleUnitMode,
      toggleValuationMode,
      toggleHidePrices,
      setAccentTheme,
      completeOnboarding,
      unlockWithPin,
      unlockWithBiometric,
      lockVault,
      setBiometricEnabled,
      updateRate,
      moveItemLocation,
      transferItemOwner,
      attachBillToItem,
      updateItemPhoto,
      updateItemNotes,
      addVaultItem,
      addFamilyMember,
      recordBackupNow,
      setVaultPin,
      addSharedMember,
      removeSharedMember,
      createVaultSnapshot,
      restoreVaultSnapshot,
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

export function useVaultPalette(): VaultPaletteType {
  return useVault().palette;
}
