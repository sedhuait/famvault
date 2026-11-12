import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

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

const STORAGE_KEY = 'famvault_state_v1';
const STATE_FILE_NAME = 'famvault-state.json';

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
    throw new Error('Invalid backup file format.');
  }

  if (
    parsed.format !== 'FAMVAULT_ENCRYPTED_V1' ||
    typeof parsed.salt !== 'string' ||
    typeof parsed.checksum !== 'string' ||
    typeof parsed.payload !== 'string'
  ) {
    throw new Error('Unsupported Famvault backup file.');
  }

  const cipherBytes = base64ToBytes(parsed.payload);
  const plainBytes = xorBytesWithKey(cipherBytes, `${pin}:${parsed.salt}`);
  const json = new TextDecoder().decode(plainBytes);

  if (fnv1aHex(`${pin}:${parsed.salt}:${json}`) !== parsed.checksum) {
    throw new Error('Incorrect Vault PIN or corrupted backup file.');
  }

  const snapshot = JSON.parse(json) as VaultSnapshot;
  if (!Array.isArray(snapshot.items) || !snapshot.rates) {
    throw new Error('Backup file is missing required vault records.');
  }
  return snapshot;
}

export async function loadVaultSnapshot(): Promise<Partial<VaultSnapshot> | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Partial<VaultSnapshot>) : null;
    }

    const file = new File(Paths.document, STATE_FILE_NAME);
    if (!file.exists) return null;
    const raw = await file.text();
    return raw ? (JSON.parse(raw) as Partial<VaultSnapshot>) : null;
  } catch {
    return null;
  }
}

export async function saveVaultSnapshot(snapshot: VaultSnapshot): Promise<void> {
  try {
    const raw = JSON.stringify(snapshot);
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, raw);
      }
      return;
    }

    const file = new File(Paths.document, STATE_FILE_NAME);
    file.create({ overwrite: true });
    await file.write(raw);
  } catch {
    // Non-fatal persistence guard
  }
}

export async function exportEncryptedBackupFile(
  snapshot: VaultSnapshot,
  pin: string,
  providerLabel: string,
): Promise<{ fileName: string; method: 'WEB_DOWNLOAD' | 'NATIVE_SHARE' }> {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const fileName = `famvault-backup-${dateStamp}.famvault`;
  const encrypted = encryptVaultBackup(snapshot, pin);

  if (Platform.OS === 'web') {
    const blob = new Blob([encrypted], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { fileName, method: 'WEB_DOWNLOAD' };
  }

  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(encrypted);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: `Save Encrypted Backup to ${providerLabel}`,
    });
  }

  return { fileName, method: 'NATIVE_SHARE' };
}

export async function pickAndRestoreBackupFile(pin: string): Promise<{
  fileName: string;
  snapshot: VaultSnapshot;
}> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'application/octet-stream', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets[0]) {
    throw new Error('CANCELLED');
  }

  const asset = result.assets[0];
  let rawText = '';

  if (Platform.OS === 'web') {
    if (asset.file) {
      rawText = await asset.file.text();
    } else {
      const response = await fetch(asset.uri);
      rawText = await response.text();
    }
  } else {
    const file = new File(asset.uri);
    rawText = await file.text();
  }

  const snapshot = decryptVaultBackup(rawText, pin);
  return { fileName: asset.name, snapshot };
}
