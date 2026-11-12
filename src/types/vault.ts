export type MetalType = 'GOLD' | 'SILVER' | 'DIAMOND' | 'PLATINUM';

export type ItemCategory =
  | 'NECKLACE'
  | 'BANGLE'
  | 'EARRING'
  | 'RING'
  | 'ANKLET_WAISTBAND'
  | 'COIN_BAR'
  | 'SGB'
  | 'POOJA_VESSEL'
  | 'SILVER_UTENSIL'
  | 'OTHER';

export type Purity =
  | 'GOLD_24K'
  | 'GOLD_22K'
  | 'GOLD_18K'
  | 'GOLD_14K'
  | 'SILVER_999'
  | 'SILVER_925'
  | 'SILVER_VESSEL_80'
  | 'PLATINUM_950';

export type CustodyLocation =
  | 'BANK_LOCKER'
  | 'HOME_SAFE'
  | 'POOJA_ROOM'
  | 'GOLD_LOAN'
  | 'DAILY_WEAR'
  | 'WITH_FAMILY';

export type HistoryActionType =
  | 'ITEM_CREATED'
  | 'LOCATION_CHANGED'
  | 'LOAN_PLEDGED'
  | 'LOAN_RELEASED'
  | 'OWNER_TRANSFERRED'
  | 'WEIGHT_OR_PURITY_EDITED'
  | 'BILL_UPLOADED'
  | 'NOTE_LOGGED';

export type WeightUnitMode = 'GRAMS' | 'PAVAN';
export type ValuationMode = 'CASH' | 'REPLACEMENT';

export type CbdtCategory = 'MARRIED_WOMAN' | 'UNMARRIED_WOMAN' | 'MALE' | 'JOINT';

export interface FamilyMember {
  name: string;
  cbdtCategory: CbdtCategory;
  cbdtSafeLimitGrams: number;
}

export interface VaultItem {
  id: string;
  title: string;
  metalType: MetalType;
  category: ItemCategory;
  purity: Purity;
  grossWeightGrams: number;
  netMetalWeightGrams: number;
  diamondCarats?: number;
  diamondClarityColor?: string;
  certNumber?: string;
  manualDiamondValue?: number;
  location: CustodyLocation;
  locationDetail?: string;
  loanAmount?: number;
  loanLender?: string;
  loanInterestRate?: number;
  loanMaturityDate?: string;
  returnReminderDate?: string;
  ownerName: string;
  itemPhotoUri?: string;
  billPhotoUri?: string;
  billFileName?: string;
  billMimeType?: string;
  certPhotoUri?: string;
  compressedPhotoKb?: number;
  compressedBillKb?: number;
  purchasePrice?: number;
  jewelerName?: string;
  invoiceNumber?: string;
  purchaseDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultItemHistory {
  id: string;
  itemId: string;
  actionType: HistoryActionType;
  fieldChanged?: string;
  previousValue?: string;
  newValue?: string;
  metadataJson?: string;
  remarks?: string;
  timestamp: string;
}

export type BullionRatesPerGram = Record<Purity, number>;
