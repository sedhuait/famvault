import type { AccentThemeId } from '@/constants/vault-theme';
import type {
  BullionRatesPerGram,
  FamilyMember,
  ValuationMode,
  VaultItem,
  VaultItemHistory,
  WeightUnitMode,
} from '@/types/vault';

export interface SharedFamilyMember {
  id: string;
  name: string;
  contact: string;
  role: 'EDITOR' | 'VIEWER';
}

export interface VaultSnapshot {
  version: 1;
  savedAt: string;
  items: VaultItem[];
  history: VaultItemHistory[];
  rates: BullionRatesPerGram;
  members: FamilyMember[];
  unitMode: WeightUnitMode;
  valuationMode: ValuationMode;
  hidePrices: boolean;
  compactMode: boolean;
  accentTheme: AccentThemeId;
  biometricEnabled: boolean;
  lastBackupAt: string;
  isProUnlocked: boolean;
  vaultPin: string;
  sharedMembers: SharedFamilyMember[];
}

interface EncryptedBackupEnvelope {
  format: 'FAMVAULT_ENCRYPTED_V1';
  exportedAt: string;
  salt: string;
  checksum: string;
  payload: string;
}

function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function xorBytesWithKey(bytes: Uint8Array, secret: string): Uint8Array {
  let seed = 0x811c9dc5;
  for (let i = 0; i < secret.length; i += 1) {
    seed ^= secret.charCodeAt(i);
    seed = Math.imul(seed, 0x01000193);
  }
  let state = seed >>> 0 || 0x9e3779b9;
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    out[i] = bytes[i] ^ ((state >>> 0) & 0xff);
  }
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encryptVaultBackup(snapshot: VaultSnapshot, pin: string): string {
  const json = JSON.stringify(snapshot);
  const salt = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const checksum = fnv1aHex(`${pin}:${salt}:${json}`);
  const plainBytes = new TextEncoder().encode(json);
  const cipherBytes = xorBytesWithKey(plainBytes, `${pin}:${salt}`);

  const envelope: EncryptedBackupEnvelope = {
    format: 'FAMVAULT_ENCRYPTED_V1',
    exportedAt: new Date().toISOString(),
    salt,
    checksum,
    payload: bytesToBase64(cipherBytes),
  };

  return JSON.stringify(envelope, null, 2);
}

export function decryptVaultBackup(rawText: string, pin: string): VaultSnapshot {
  let parsed: Partial<EncryptedBackupEnvelope>;
  try {
    parsed = JSON.parse(rawText) as Partial<EncryptedBackupEnvelope>;
  } catch {
    throw new Error('Invalid encrypted vault format.');
  }

  if (
    parsed.format !== 'FAMVAULT_ENCRYPTED_V1' ||
    typeof parsed.salt !== 'string' ||
    typeof parsed.checksum !== 'string' ||
    typeof parsed.payload !== 'string'
  ) {
    throw new Error('Unsupported Famvault encrypted file.');
  }

  const cipherBytes = base64ToBytes(parsed.payload);
  const plainBytes = xorBytesWithKey(cipherBytes, `${pin}:${parsed.salt}`);
  const json = new TextDecoder().decode(plainBytes);

  if (fnv1aHex(`${pin}:${parsed.salt}:${json}`) !== parsed.checksum) {
    throw new Error('Incorrect 6-digit Vault PIN.');
  }

  const snapshot = JSON.parse(json) as VaultSnapshot;
  if (!Array.isArray(snapshot.items) || !snapshot.rates) {
    throw new Error('Encrypted vault is missing required records.');
  }
  return snapshot;
}
