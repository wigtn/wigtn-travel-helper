# 영수증 기반 지출 입력 PRD

> **Version**: 1.1
> **Created**: 2026-01-28
> **Updated**: 2026-01-28
> **Status**: Draft (Reviewed)
> **Platform**: Mobile (React Native / Expo)

## 1. Overview

### 1.1 Problem Statement
현재 지출 입력 시 모든 항목(금액, 카테고리, 날짜 등)을 수동으로 입력해야 합니다. 여행 중 빈번한 지출 발생 시 입력이 번거롭고, 영수증 정보를 일일이 확인하며 입력하는 과정에서 오류가 발생할 수 있습니다.

### 1.2 Goals
- 영수증 사진 촬영/선택을 통한 지출 입력 간소화
- 직접 입력과 영수증 입력 두 가지 경로 제공으로 사용자 선택권 확대
- 카메라 촬영과 갤러리 선택 두 가지 이미지 입력 방식 지원
- 향후 AI OCR 연동을 위한 확장 가능한 구조 설계

### 1.3 Non-Goals (Out of Scope)
- AI OCR 자동 인식 (Phase 2에서 구현 예정)
- 영수증 이미지 서버 저장 (Phase 1에서는 로컬만)
- 다중 영수증 동시 처리
- 영수증 이미지 편집/크롭 기능

### 1.4 Scope

| 포함 | 제외 |
|------|------|
| 지출 입력 모달 UI 분기 (영수증/직접 입력) | AI OCR 자동 인식 |
| 카메라 촬영으로 영수증 캡처 | 서버 이미지 저장 |
| 갤러리에서 영수증 이미지 선택 | 다중 이미지 처리 |
| 영수증 미리보기 표시 | 이미지 편집/크롭 |
| 영수증 첨부 후 수동 금액 입력 | 영수증 히스토리 관리 |
| 이미지 생명주기 관리 (임시 저장/삭제) | - |

## 2. User Stories

### 2.1 Primary User Stories

**US-001**: 지출 입력 방식 선택
```
As a 여행자
I want to 지출 입력 시 영수증 입력과 직접 입력 중 선택할 수 있기를 원합니다
So that 상황에 따라 가장 편한 방식으로 지출을 기록할 수 있습니다
```

**US-002**: 카메라로 영수증 촬영
```
As a 여행자
I want to 카메라로 영수증을 촬영하여 지출을 등록하고 싶습니다
So that 영수증을 받자마자 바로 기록할 수 있습니다
```

**US-003**: 갤러리에서 영수증 선택
```
As a 여행자
I want to 갤러리에 저장된 영수증 사진을 선택하여 지출을 등록하고 싶습니다
So that 나중에 모아서 한꺼번에 정리할 수 있습니다
```

### 2.2 Acceptance Criteria (Gherkin)

**Scenario: 지출 입력 방식 선택**
```gherkin
Given 사용자가 FAB(+) 버튼을 눌러 지출 입력을 시작했을 때
When 지출 입력 모달이 열리면
Then "영수증 입력하기"와 "직접 입력하기" 두 가지 선택지가 표시되어야 한다
And 각 선택지에 적절한 아이콘과 설명이 표시되어야 한다
```

**Scenario: 영수증 입력 방식 선택**
```gherkin
Given 사용자가 "영수증 입력하기"를 선택했을 때
When 영수증 입력 옵션 화면이 표시되면
Then "카메라로 촬영"과 "갤러리에서 선택" 두 가지 옵션이 표시되어야 한다
And 각 옵션에 적절한 아이콘이 표시되어야 한다
```

**Scenario: 카메라로 영수증 촬영**
```gherkin
Given 사용자가 "카메라로 촬영"을 선택했을 때
When 카메라 권한이 없으면
Then 카메라 권한 요청 다이얼로그가 표시되어야 한다

Given 카메라 권한이 허용되었을 때
When 카메라 화면이 열리면
Then 촬영 버튼, 플래시 토글, 뒤로가기 버튼이 표시되어야 한다
And 촬영 후 미리보기 화면으로 이동해야 한다

Given 카메라 촬영이 실패했을 때
Then "촬영에 실패했습니다. 다시 시도해주세요" 알림이 표시되어야 한다
```

**Scenario: 갤러리에서 이미지 선택**
```gherkin
Given 사용자가 "갤러리에서 선택"을 선택했을 때
When 갤러리 접근 권한이 없으면
Then 갤러리 권한 요청 다이얼로그가 표시되어야 한다

Given 갤러리 권한이 허용되었을 때
When 이미지를 선택하면
Then 선택한 이미지의 미리보기가 표시되어야 한다
And 지출 정보 입력 폼이 함께 표시되어야 한다

Given 10MB 초과 이미지를 선택했을 때
Then "이미지가 너무 큽니다. 다른 이미지를 선택해주세요" 알림이 표시되어야 한다
```

**Scenario: 권한 영구 거부 시**
```gherkin
Given 사용자가 카메라/갤러리 권한을 "다시 묻지 않음"으로 거부했을 때
When 영수증 입력을 시도하면
Then "설정에서 권한을 허용해주세요" 안내가 표시되어야 한다
And "설정으로 이동" 버튼이 표시되어야 한다
And 버튼 클릭 시 앱 설정 화면으로 이동해야 한다
```

**Scenario: 영수증 첨부 후 지출 정보 입력**
```gherkin
Given 영수증 이미지가 선택/촬영되었을 때
When 지출 정보 입력 폼이 표시되면
Then 영수증 미리보기가 상단에 표시되어야 한다
And 금액, 카테고리, 날짜, 메모 입력 필드가 표시되어야 한다
And "다시 촬영" 또는 "다시 선택" 버튼이 있어야 한다
And 기존과 동일한 여행/방문지 선택 로직이 적용되어야 한다
```

**Scenario: 지출 저장 완료 시 이미지 정리**
```gherkin
Given 영수증 이미지가 첨부된 상태에서
When 지출 저장을 완료하면
Then 임시 저장된 영수증 이미지가 삭제되어야 한다

Given 영수증 이미지가 첨부된 상태에서
When 뒤로가기 또는 취소를 하면
Then 임시 저장된 영수증 이미지가 삭제되어야 한다
```

## 3. Functional Requirements

| ID | Requirement | Priority | Dependencies |
|----|-------------|----------|--------------|
| FR-001 | 지출 입력 모달에서 영수증/직접 입력 선택 UI 표시 | P0 (Must) | - |
| FR-002 | 영수증 입력 선택 시 카메라/갤러리 선택 UI 표시 | P0 (Must) | FR-001 |
| FR-003 | expo-camera를 통한 카메라 촬영 기능 | P0 (Must) | FR-002 |
| FR-004 | expo-image-picker를 통한 갤러리 선택 기능 | P0 (Must) | FR-002 |
| FR-005 | 영수증 이미지 미리보기 표시 | P0 (Must) | FR-003, FR-004 |
| FR-006 | 영수증 첨부 상태에서 지출 정보 수동 입력 | P0 (Must) | FR-005 |
| FR-007 | 이미지 다시 선택/촬영 기능 | P1 (Should) | FR-005 |
| FR-008 | 카메라/갤러리 권한 요청 및 거부 시 안내 | P0 (Must) | FR-003, FR-004 |
| FR-009 | 영수증 이미지 로컬 임시 저장 | P1 (Should) | FR-005 |
| FR-010 | 직접 입력 선택 시 기존 지출 입력 폼으로 이동 | P0 (Must) | FR-001 |
| FR-011 | 영수증 이미지 생명주기 관리 (저장/취소 시 삭제) | P0 (Must) | FR-009 |
| FR-012 | 권한 영구 거부 시 설정 화면 이동 안내 | P0 (Must) | FR-008 |
| FR-013 | 카메라 촬영 실패 시 에러 처리 및 안내 | P0 (Must) | FR-003 |
| FR-014 | 이미지 용량 초과 시 안내 (10MB 초과) | P1 (Should) | FR-004 |
| FR-015 | 카메라 플래시 on/off/auto 토글 | P2 (Could) | FR-003 |
| FR-016 | 오프라인 상태에서도 영수증 입력 가능 | P1 (Should) | - |

## 4. Non-Functional Requirements

### 4.1 Performance
- 카메라 실행 시간: < 1초
- 갤러리 이미지 로딩: < 500ms
- 이미지 미리보기 렌더링: < 300ms
- 이미지 압축 처리: < 1초

### 4.2 UX
- 권한 거부 시 명확한 안내 메시지와 설정으로 이동 옵션 제공
- 권한 영구 거부 시 `Linking.openSettings()`로 앱 설정 이동
- 이미지 촬영/선택 후 즉시 미리보기 표시
- 뒤로가기로 언제든 이전 단계로 복귀 가능
- 촬영 실패 시 명확한 에러 메시지 표시

### 4.3 Image Specifications
- 지원 포맷: JPEG, PNG, HEIC (iOS)
- 최대 해상도: 1920x1080 (자동 리사이징)
- 최대 파일 크기: 10MB (초과 시 안내)
- 권장 파일 크기: 5MB 이하 (자동 압축)
- 이미지 품질: 80% (압축)

### 4.4 Image Lifecycle
- 임시 저장 경로: `FileSystem.cacheDirectory/receipts/`
- 지출 저장 완료 시: 임시 이미지 삭제
- 저장 취소/뒤로가기 시: 임시 이미지 즉시 삭제
- 앱 시작 시: 24시간 이상 된 임시 파일 자동 정리

### 4.5 Accessibility
- 영수증 입력하기 버튼: `accessibilityLabel="영수증 사진으로 지출 등록"`
- 직접 입력하기 버튼: `accessibilityLabel="금액과 정보를 직접 입력하여 지출 등록"`
- 카메라로 촬영 버튼: `accessibilityLabel="카메라로 영수증 촬영하기"`
- 갤러리에서 선택 버튼: `accessibilityLabel="갤러리에서 영수증 사진 선택하기"`
- 촬영 버튼: `accessibilityLabel="영수증 촬영"`
- 영수증 미리보기: `accessibilityLabel="촬영된 영수증 이미지"`

### 4.6 Offline Support
- 영수증 입력은 오프라인에서도 완전 지원
- Phase 1에서는 이미지를 서버에 저장하지 않으므로 네트워크 불필요
- 지출 데이터는 기존 오프라인 동기화 로직 활용

## 5. Technical Design

### 5.1 필수 패키지 설치

```bash
# Expo가 자동으로 현재 SDK와 호환되는 버전 선택
npx expo install expo-camera expo-image-picker expo-file-system expo-linking
```

**버전 호환성 확인**:
- 현재 프로젝트: `expo: ~54.0.31`, `react-native: 0.81.5`
- `npx expo install`은 자동으로 호환 버전 선택
- 설치 후 `npx expo doctor`로 호환성 검증 권장

### 5.2 앱 권한 설정 (app.json)

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-sqlite",
      [
        "expo-camera",
        {
          "cameraPermission": "영수증 촬영을 위해 카메라 접근 권한이 필요합니다."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "영수증 사진 선택을 위해 갤러리 접근 권한이 필요합니다."
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "영수증 촬영을 위해 카메라 접근 권한이 필요합니다.",
        "NSPhotoLibraryUsageDescription": "영수증 사진 선택을 위해 갤러리 접근 권한이 필요합니다."
      }
    },
    "android": {
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "READ_MEDIA_IMAGES"
      ]
    }
  }
}
```

### 5.3 UI Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    FAB(+) 버튼 클릭                          │
│                           │                                  │
│                           ▼                                  │
│              ┌─────────────────────────┐                    │
│              │   지출 입력 방식 선택    │                    │
│              │                         │                    │
│              │  ┌───────────────────┐  │                    │
│              │  │ 📷 영수증 입력하기 │  │                    │
│              │  │ 영수증 사진으로    │  │                    │
│              │  │ 빠르게 등록       │  │                    │
│              │  └───────────────────┘  │                    │
│              │                         │                    │
│              │  ┌───────────────────┐  │                    │
│              │  │ ✏️ 직접 입력하기   │  │                    │
│              │  │ 금액과 정보를     │  │                    │
│              │  │ 직접 입력        │  │                    │
│              │  └───────────────────┘  │                    │
│              └─────────────────────────┘                    │
│                     │              │                         │
│      ┌──────────────┘              └──────────────┐          │
│      ▼                                            ▼          │
│ ┌──────────────────┐                  ┌──────────────────┐  │
│ │ 영수증 입력 옵션  │                  │ 기존 지출 입력   │  │
│ │                  │                  │ 폼 (분리된       │  │
│ │ ┌──────────────┐ │                  │ 컴포넌트)       │  │
│ │ │ 📸 카메라로  │ │                  └──────────────────┘  │
│ │ │    촬영     │ │                                        │
│ │ └──────────────┘ │                                        │
│ │                  │                                        │
│ │ ┌──────────────┐ │                                        │
│ │ │ 🖼️ 갤러리에서│ │                                        │
│ │ │    선택     │ │                                        │
│ │ └──────────────┘ │                                        │
│ └──────────────────┘                                        │
│      │                      │                                │
│      ▼                      ▼                                │
│ ┌──────────────────┐  ┌──────────────────┐                  │
│ │   카메라 화면    │  │  갤러리 피커     │                  │
│ │ ┌──────────────┐ │  │  (시스템 UI)     │                  │
│ │ │ ← ⚡auto 🔄  │ │  └──────────────────┘                  │
│ │ ├──────────────┤ │           │                            │
│ │ │              │ │           │                            │
│ │ │  [카메라뷰]   │ │           │                            │
│ │ │              │ │           │                            │
│ │ ├──────────────┤ │           │                            │
│ │ │    [ 📸 ]    │ │           │                            │
│ │ └──────────────┘ │           │                            │
│ └──────────────────┘           │                            │
│         │                      │                            │
│         └──────────┬───────────┘                            │
│                    ▼                                        │
│ ┌──────────────────────────────────────┐                    │
│ │       영수증 + 지출 입력 폼          │                    │
│ │  ┌────────────────────────────────┐  │                    │
│ │  │      📷 영수증 미리보기         │  │                    │
│ │  │      [다시 촬영/선택]          │  │                    │
│ │  └────────────────────────────────┘  │                    │
│ │                                      │                    │
│ │  (기존 지출 입력 폼과 동일)           │                    │
│ │  - 여행/방문지 선택                  │                    │
│ │  - 금액 입력                         │                    │
│ │  - 카테고리 선택                     │                    │
│ │  - 날짜/시간 선택                    │                    │
│ │  - 메모 입력                         │                    │
│ │                                      │                    │
│ │        [저장하기]                    │                    │
│ │  (저장 완료 시 임시 이미지 삭제)      │                    │
│ └──────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 컴포넌트 구조

```
app/
├── expense/
│   ├── new.tsx                    # 지출 입력 방식 선택 (라우터 역할)
│   └── [id].tsx                   # 지출 수정 화면
│
components/
├── expense/
│   ├── ExpenseInputMethodSelector.tsx  # 입력 방식 선택 (영수증/직접)
│   ├── ExpenseDirectInputForm.tsx      # 기존 직접 입력 폼 (추출)
│   ├── ReceiptInputOptions.tsx         # 영수증 입력 옵션 (카메라/갤러리)
│   ├── ReceiptCamera.tsx               # 카메라 촬영 화면
│   ├── ReceiptPreview.tsx              # 영수증 미리보기
│   ├── ExpenseFormWithReceipt.tsx      # 영수증 첨부 지출 입력 폼
│   └── index.ts
│
lib/
├── utils/
│   └── image.ts                        # 이미지 유틸리티 함수
```

### 5.4.1 expense/new.tsx 수정 전략

1. **기존 직접 입력 로직** → `ExpenseDirectInputForm.tsx`로 추출
2. **expense/new.tsx**는 입력 방식 선택만 담당 (라우터 역할)
3. **상태 플로우**:
   ```typescript
   type InputStep = 'select-method' | 'receipt-options' | 'camera' | 'manual' | 'receipt-form';

   const [step, setStep] = useState<InputStep>('select-method');
   const [receiptImage, setReceiptImage] = useState<ReceiptImage | null>(null);

   // step에 따라 적절한 컴포넌트 렌더링
   switch (step) {
     case 'select-method': return <ExpenseInputMethodSelector onSelect={...} />;
     case 'receipt-options': return <ReceiptInputOptions onSelect={...} />;
     case 'camera': return <ReceiptCamera onCapture={...} />;
     case 'manual': return <ExpenseDirectInputForm />;
     case 'receipt-form': return <ExpenseFormWithReceipt image={receiptImage} />;
   }
   ```
4. **여행/방문지 선택 로직**: 기존 로직을 공통 훅으로 추출하여 재사용

### 5.5 타입 정의

```typescript
// lib/types.ts에 추가

export interface ReceiptImage {
  uri: string;           // 로컬 파일 경로
  width: number;
  height: number;
  type: 'camera' | 'gallery';
  mimeType?: string;
  fileSize?: number;
}

export type ExpenseInputMethod = 'receipt' | 'manual';
export type ReceiptInputSource = 'camera' | 'gallery';

export interface ExpenseWithReceipt extends Omit<Expense, 'id' | 'createdAt'> {
  receiptImage?: ReceiptImage;
}

// 이미지 처리 결과 타입
export interface ImageCaptureResult {
  success: boolean;
  image?: ReceiptImage;
  error?: 'CAMERA_NOT_READY' | 'CAPTURE_FAILED' | 'PERMISSION_DENIED' | 'FILE_TOO_LARGE' | 'CANCELLED';
}
```

### 5.6 주요 함수

```typescript
// lib/utils/image.ts

import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import { ReceiptImage, ImageCaptureResult } from '../types';

const RECEIPT_CACHE_DIR = `${FileSystem.cacheDirectory}receipts/`;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 캐시 디렉토리 초기화
export async function initReceiptCacheDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(RECEIPT_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(RECEIPT_CACHE_DIR, { intermediates: true });
  }
}

// 오래된 임시 파일 정리 (24시간 이상)
export async function cleanupOldReceiptCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(RECEIPT_CACHE_DIR);
    if (!dirInfo.exists) return;

    const files = await FileSystem.readDirectoryAsync(RECEIPT_CACHE_DIR);
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = `${RECEIPT_CACHE_DIR}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists && fileInfo.modificationTime) {
        if (now - fileInfo.modificationTime * 1000 > ONE_DAY) {
          await FileSystem.deleteAsync(filePath, { idempotent: true });
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
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    console.warn('Failed to delete receipt image:', error);
  }
}

// 카메라 권한 요청
export async function requestCameraPermission(): Promise<'granted' | 'denied' | 'never_ask_again'> {
  const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
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
  if (permission === 'never_ask_again') {
    return { success: false, error: 'PERMISSION_DENIED' };
  }
  if (permission === 'denied') {
    return { success: false, error: 'PERMISSION_DENIED' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
  cameraRef: React.RefObject<Camera>
): Promise<ImageCaptureResult> {
  try {
    if (!cameraRef.current) {
      return { success: false, error: 'CAMERA_NOT_READY' };
    }

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.8,
      exif: false,
    });

    // 캐시 디렉토리로 이동
    await initReceiptCacheDir();
    const fileName = `receipt_${Date.now()}.jpg`;
    const newUri = `${RECEIPT_CACHE_DIR}${fileName}`;
    await FileSystem.moveAsync({ from: photo.uri, to: newUri });

    return {
      success: true,
      image: {
        uri: newUri,
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
```

## 6. Implementation Phases

### Phase 1: 환경 설정 및 기본 UI (MVP)
- [ ] expo-camera, expo-image-picker, expo-file-system, expo-linking 패키지 설치
- [ ] `npx expo doctor`로 버전 호환성 검증
- [ ] app.json 권한 설정 추가
- [ ] lib/types.ts에 타입 추가
- [ ] lib/utils/image.ts 유틸리티 함수 생성
- [ ] ExpenseInputMethodSelector 컴포넌트 구현
- [ ] ReceiptInputOptions 컴포넌트 구현
- [ ] expense/new.tsx 수정 (상태 플로우 구현)

**Deliverable**: 지출 입력 방식 선택 UI 및 권한 처리

### Phase 2: 기존 코드 리팩토링
- [ ] ExpenseDirectInputForm.tsx로 기존 직접 입력 로직 추출
- [ ] 여행/방문지 선택 로직을 공통 훅으로 추출
- [ ] expense/new.tsx에서 분리된 컴포넌트 사용하도록 수정

**Deliverable**: 코드 분리 및 재사용 가능한 구조

### Phase 3: 카메라 촬영 기능
- [ ] ReceiptCamera 컴포넌트 구현
- [ ] 카메라 권한 요청 및 영구 거부 처리
- [ ] 플래시 토글 (auto/on/off) 구현
- [ ] 카메라 촬영 및 에러 처리
- [ ] 촬영 후 미리보기 연결

**Deliverable**: 카메라로 영수증 촬영 기능

### Phase 4: 갤러리 선택 기능
- [ ] 갤러리 권한 요청 및 영구 거부 처리
- [ ] 갤러리 이미지 선택 로직 (용량 체크 포함)
- [ ] ReceiptPreview 컴포넌트 구현
- [ ] 이미지 선택 후 미리보기 연결

**Deliverable**: 갤러리에서 영수증 선택 기능

### Phase 5: 영수증 첨부 지출 입력 폼
- [ ] ExpenseFormWithReceipt 컴포넌트 구현
- [ ] 영수증 미리보기 + 지출 입력 폼 통합
- [ ] 다시 촬영/선택 기능 구현
- [ ] 지출 저장 로직 연결 (기존 createExpense 활용)
- [ ] 저장/취소 시 임시 이미지 삭제 로직

**Deliverable**: 영수증 첨부 상태에서 지출 등록 완료

### Phase 6: 테스트 및 마무리
- [ ] 앱 시작 시 오래된 캐시 정리 로직 추가
- [ ] iOS/Android 권한 테스트
- [ ] 카메라/갤러리 기능 테스트
- [ ] 에러 핸들링 검증
- [ ] TypeScript 타입 체크 통과 확인
- [ ] UX 개선 및 접근성 검증

**Deliverable**: 안정적인 영수증 입력 기능

## 7. Test Checklist

### 권한 테스트
- [ ] iOS: 카메라 권한 최초 요청 → 허용
- [ ] iOS: 카메라 권한 최초 요청 → 거부 → 재시도
- [ ] iOS: 카메라 권한 영구 거부 → 설정 이동 안내
- [ ] iOS: 갤러리 권한 최초 요청 → 허용
- [ ] iOS: 갤러리 권한 영구 거부 → 설정 이동 안내
- [ ] Android: 동일 케이스 테스트

### 카메라 테스트
- [ ] 실제 iOS 기기: 촬영 성공
- [ ] 실제 Android 기기: 촬영 성공
- [ ] 저조도 환경에서 플래시 on 촬영
- [ ] 촬영 중 앱 백그라운드 → 포그라운드 복귀
- [ ] 촬영 실패 시 에러 메시지 확인

### 갤러리 테스트
- [ ] iOS 시뮬레이터: 이미지 선택
- [ ] Android 에뮬레이터: 이미지 선택
- [ ] 10MB 초과 이미지 선택 시 안내 메시지
- [ ] 선택 취소 시 정상 복귀

### 이미지 생명주기 테스트
- [ ] 저장 완료 후 임시 이미지 삭제 확인
- [ ] 뒤로가기 후 임시 이미지 삭제 확인
- [ ] 앱 재시작 후 오래된 캐시 정리 확인

### 통합 테스트
- [ ] 영수증 촬영 → 지출 정보 입력 → 저장 완료
- [ ] 갤러리 선택 → 지출 정보 입력 → 저장 완료
- [ ] 오프라인 상태에서 전체 플로우 동작 확인

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| 영수증 입력 사용률 | 30% 이상 | 전체 지출 중 영수증 입력 비율 |
| 카메라 촬영 성공률 | 95% 이상 | 촬영 시도 대비 성공 |
| 갤러리 선택 성공률 | 98% 이상 | 선택 시도 대비 성공 |
| 권한 허용률 | 80% 이상 | 권한 요청 대비 허용 |
| 임시 파일 정리율 | 100% | 24시간 후 임시 파일 잔류 없음 |

## 9. Future Enhancements (Phase 2)

### AI OCR 자동 인식 (PRD-v3-backend-ai.md 참조)
- 영수증 이미지에서 금액, 날짜, 가게명 자동 추출
- VLM(Vision Language Model) 기반 OCR
- 서버 사이드 이미지 처리
- 인식 결과 수정 기능

### 영수증 이미지 서버 저장
- 지출과 함께 영수증 이미지 서버 저장
- 영수증 히스토리 조회
- 클라우드 백업

### 추가 카메라 기능
- 전면/후면 카메라 전환
- 영수증 가이드 프레임 표시
- 자동 문서 감지 및 크롭

---

## Appendix: UI 목업

### A. 지출 입력 방식 선택 화면

```
┌──────────────────────────────────┐
│ ✕ 지출 입력                       │
├──────────────────────────────────┤
│                                  │
│     어떻게 지출을 등록할까요?      │
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │      📷                    │  │
│  │                            │  │
│  │   영수증 입력하기            │  │
│  │   영수증 사진으로 빠르게 등록  │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │      ✏️                    │  │
│  │                            │  │
│  │   직접 입력하기              │  │
│  │   금액과 정보를 직접 입력     │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

### B. 영수증 입력 옵션 화면

```
┌──────────────────────────────────┐
│ ← 영수증 입력                     │
├──────────────────────────────────┤
│                                  │
│     영수증을 어떻게 가져올까요?    │
│                                  │
│  ┌────────────────────────────┐  │
│  │     📸  카메라로 촬영        │  │
│  │     지금 바로 영수증 촬영     │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │     🖼️  갤러리에서 선택      │  │
│  │     저장된 사진에서 선택      │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

### C. 카메라 촬영 화면

```
┌──────────────────────────────────┐
│ ←              ⚡auto            │
├──────────────────────────────────┤
│                                  │
│                                  │
│    ┌────────────────────────┐    │
│    │                        │    │
│    │                        │    │
│    │     [카메라 프리뷰]      │    │
│    │                        │    │
│    │                        │    │
│    └────────────────────────┘    │
│                                  │
│                                  │
│           ┌────────┐             │
│           │   📸   │             │
│           └────────┘             │
│                                  │
└──────────────────────────────────┘

플래시 상태: auto(기본) / on / off 토글
```

### D. 영수증 첨부 지출 입력 폼

```
┌──────────────────────────────────┐
│ ← 지출 등록                       │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │     [영수증 이미지 미리보기]   │  │
│  │                            │  │
│  │      [다시 촬영]            │  │
│  └────────────────────────────┘  │
│                                  │
│  여행                            │
│  ┌────────────────────────────┐  │
│  │ 🇯🇵 도쿄 여행             ▼ │  │
│  └────────────────────────────┘  │
│                                  │
│  방문지                          │
│  ┌────────────────────────────┐  │
│  │ 🇯🇵 도쿄                  ▼ │  │
│  └────────────────────────────┘  │
│                                  │
│  금액                            │
│  ┌────────────────────────────┐  │
│  │        ¥ 1,500             │  │
│  │        ≈ ₩13,875           │  │
│  └────────────────────────────┘  │
│                                  │
│  카테고리                        │
│  [🍔식비] [🚗교통] [🛍️쇼핑] ... │
│                                  │
│  날짜        시간                │
│  [2026-01-28] [14:30]           │
│                                  │
│  메모 (선택)                     │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │         저장하기            │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### E. 권한 거부 안내 화면

```
┌──────────────────────────────────┐
│ ← 영수증 입력                     │
├──────────────────────────────────┤
│                                  │
│                                  │
│           🔒                     │
│                                  │
│     카메라 권한이 필요합니다       │
│                                  │
│   영수증 촬영을 위해              │
│   설정에서 카메라 권한을          │
│   허용해주세요.                   │
│                                  │
│  ┌────────────────────────────┐  │
│  │       설정으로 이동          │  │
│  └────────────────────────────┘  │
│                                  │
│         나중에 하기              │
│                                  │
└──────────────────────────────────┘
```
