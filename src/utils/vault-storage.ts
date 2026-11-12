import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import {
  decryptVaultBackup,
  encryptVaultBackup,
  type SharedFamilyMember,
  type VaultSnapshot,
} from '@/utils/vault-crypto';

export { decryptVaultBackup, encryptVaultBackup, type SharedFamilyMember, type VaultSnapshot };

const ENCRYPTED_STORAGE_KEY = 'famvault_encrypted_v1';
const ENCRYPTED_FILE_NAME = 'famvault-vault.enc';
const BIOMETRIC_PIN_KEY = 'famvault_bio_pin';

export async function hasEncryptedVault(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return false;
      return Boolean(localStorage.getItem(ENCRYPTED_STORAGE_KEY));
    }

    const file = new File(Paths.document, ENCRYPTED_FILE_NAME);
    return file.exists;
  } catch {
    return false;
  }
}

export async function saveEncryptedVaultSnapshot(
  snapshot: VaultSnapshot,
  pin: string,
): Promise<void> {
  const encrypted = encryptVaultBackup(snapshot, pin);
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ENCRYPTED_STORAGE_KEY, encrypted);
    }
    return;
  }

  const file = new File(Paths.document, ENCRYPTED_FILE_NAME);
  file.create({ overwrite: true });
  await file.write(encrypted);
}

export async function unlockAndDecryptVault(pin: string): Promise<VaultSnapshot> {
  let raw: string | null = null;

  if (Platform.OS === 'web') {
    raw = typeof localStorage !== 'undefined' ? localStorage.getItem(ENCRYPTED_STORAGE_KEY) : null;
  } else {
    const file = new File(Paths.document, ENCRYPTED_FILE_NAME);
    if (file.exists) {
      raw = await file.text();
    }
  }

  if (!raw) {
    throw new Error('No encrypted vault found on this device.');
  }

  return decryptVaultBackup(raw, pin);
}

export async function saveBiometricPin(pin: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await SecureStore.setItemAsync(BIOMETRIC_PIN_KEY, pin);
  } catch {
    // Keychain/Keystore unavailable on simulator without entitlement
  }
}

export async function getBiometricPin(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    return await SecureStore.getItemAsync(BIOMETRIC_PIN_KEY);
  } catch {
    return null;
  }
}

export async function clearBiometricPin(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_PIN_KEY);
  } catch {
    // Ignore
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
