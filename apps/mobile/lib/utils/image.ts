// Travel Helper - Image Utilities for Receipt Input
// PRD receipt-expense-input v1.1

import * as ImagePicker from 'expo-image-picker';
import { CameraView } from 'expo-camera';
import { File, Directory, Paths } from 'expo-file-system';
import * as Linking from 'expo-linking';
import { ReceiptImage, ImageCaptureResult } from '../types';

const RECEIPT_DIR_NAME = 'receipts';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 영수증 캐시 디렉토리 객체 가져오기
function getReceiptCacheDir(): Directory {
  return new Directory(Paths.cache, RECEIPT_DIR_NAME);
}

// 캐시 디렉토리 초기화
export async function initReceiptCacheDir(): Promise<void> {
  const dir = getReceiptCacheDir();
  if (!dir.exists) {
    await dir.create();
  }
}

// 오래된 임시 파일 정리 (24시간 이상)
export async function cleanupOldReceiptCache(): Promise<void> {
  try {
    const dir = getReceiptCacheDir();
    if (!dir.exists) return;

    const files = await dir.list();
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    for (const item of files) {
      if (item instanceof File) {
        try {
          const info = item.info();
          if (info && info.modificationTime) {
            const modTime = typeof info.modificationTime === 'number'
              ? info.modificationTime
              : (info.modificationTime as Date).getTime();
            if (now - modTime > ONE_DAY) {
              await item.delete();
            }
          }
        } catch {
          // Skip files that can't be read
        }
      }
    }
  } catch (error) {
    console.warn('Failed to cleanup receipt cache:', error);
  }
}

// 임시 이미지 삭제
export async function deleteReceiptImage(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) {
      await file.delete();
    }
  } catch (error) {
    console.warn('Failed to delete receipt image:', error);
  }
}

// 카메라 권한 요청
export async function requestCameraPermission(): Promise<'granted' | 'denied' | 'never_ask_again'> {
  const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
  if (status === 'granted') return 'granted';
  return canAskAgain ? 'denied' : 'never_ask_again';
}

// 갤러리 권한 요청
export async function requestGalleryPermission(): Promise<'granted' | 'denied' | 'never_ask_again'> {
  const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status === 'granted') return 'granted';
  return canAskAgain ? 'denied' : 'never_ask_again';
}

// 설정 화면으로 이동
export async function openAppSettings(): Promise<void> {
  await Linking.openSettings();
}

// 갤러리에서 이미지 선택
export async function pickImageFromGallery(): Promise<ImageCaptureResult> {
  const permission = await requestGalleryPermission();
  if (permission !== 'granted') {
    return { success: false, error: 'PERMISSION_DENIED' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.8,
    exif: false,
  });

  if (result.canceled) {
    return { success: false, error: 'CANCELLED' };
  }

  const asset = result.assets[0];

  // 파일 크기 체크
  if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
    return { success: false, error: 'FILE_TOO_LARGE' };
  }

  return {
    success: true,
    image: {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: 'gallery',
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
    },
  };
}

// 카메라로 촬영
export async function captureFromCamera(
  cameraRef: React.RefObject<CameraView | null>
): Promise<ImageCaptureResult> {
  try {
    if (!cameraRef.current) {
      return { success: false, error: 'CAMERA_NOT_READY' };
    }

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.8,
      exif: false,
    });

    if (!photo) {
      return { success: false, error: 'CAPTURE_FAILED' };
    }

    // 캐시 디렉토리로 이동
    await initReceiptCacheDir();
    const fileName = `receipt_${Date.now()}.jpg`;
    const sourceFile = new File(photo.uri);
    const destDir = getReceiptCacheDir();
    const destFile = new File(destDir, fileName);

    await sourceFile.move(destFile);

    return {
      success: true,
      image: {
        uri: destFile.uri,
        width: photo.width,
        height: photo.height,
        type: 'camera',
      },
    };
  } catch (error) {
    console.error('Camera capture failed:', error);
    return { success: false, error: 'CAPTURE_FAILED' };
  }
}

// 에러 메시지 변환
export function getImageErrorMessage(error: ImageCaptureResult['error']): string {
  switch (error) {
    case 'CAMERA_NOT_READY':
      return '카메라가 준비되지 않았습니다. 다시 시도해주세요.';
    case 'CAPTURE_FAILED':
      return '촬영에 실패했습니다. 다시 시도해주세요.';
    case 'PERMISSION_DENIED':
      return '권한이 거부되었습니다.';
    case 'FILE_TOO_LARGE':
      return '이미지가 너무 큽니다. 다른 이미지를 선택해주세요.';
    case 'CANCELLED':
      return '취소되었습니다.';
    default:
      return '알 수 없는 오류가 발생했습니다.';
  }
}
