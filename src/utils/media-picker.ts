import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export interface PickedMediaAsset {
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
}

export async function pickImageAsset(
  source: 'camera' | 'gallery',
): Promise<PickedMediaAsset | null> {
  if (source === 'camera' && Platform.OS !== 'web') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      throw new Error('Camera permission is required to capture photos.');
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.fileName ?? `photo-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
      sizeBytes: asset.fileSize,
    };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: Platform.OS !== 'web',
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName ?? `photo-${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? 'image/jpeg',
    sizeBytes: asset.fileSize,
  };
}

export async function pickInvoiceDocument(): Promise<PickedMediaAsset | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const inferredMime =
    asset.mimeType ??
    (asset.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: inferredMime,
    sizeBytes: asset.size,
  };
}

export function isRenderableImageUri(uri?: string): boolean {
  if (!uri) return false;
  return (
    uri.startsWith('data:') ||
    uri.startsWith('blob:') ||
    uri.startsWith('file://') ||
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('content://')
  );
}
