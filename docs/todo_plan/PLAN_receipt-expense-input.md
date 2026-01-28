# Task Plan: receipt-expense-input

> **Generated from**: docs/prd/PRD_receipt-expense-input.md
> **Created**: 2026-01-28
> **Status**: completed

## Execution Config

| Option | Value | Description |
|--------|-------|-------------|
| `auto_commit` | true | 완료 시 자동 커밋 |
| `commit_per_phase` | true | Phase별 중간 커밋 |
| `quality_gate` | true | /auto-commit 품질 검사 |

## Phases

### Phase 1: 환경 설정 및 기본 UI
- [x] expo-camera, expo-image-picker, expo-file-system 패키지 설치
- [x] app.json에 카메라/갤러리 권한 설정 추가
- [x] lib/types.ts에 ReceiptImage, ExpenseInputMethod 타입 추가
- [x] lib/utils/image.ts 유틸리티 함수 생성
- [x] ExpenseInputMethodSelector 컴포넌트 구현 (영수증/직접 입력 선택)
- [x] ReceiptInputOptions 컴포넌트 구현 (카메라/갤러리 선택)

**Deliverable**: 지출 입력 방식 선택 UI 완성 ✅

### Phase 2: 권한 처리 및 카메라 기능
- [x] 카메라 권한 요청 로직 구현
- [x] 권한 거부 시 안내 및 설정 이동 처리
- [x] ReceiptCamera 컴포넌트 구현
- [x] 카메라 촬영 및 이미지 저장 로직
- [x] 촬영 후 미리보기 연결

**Deliverable**: 카메라 촬영 기능 완성 ✅

### Phase 3: 갤러리 선택 기능
- [x] 갤러리 권한 요청 로직 구현
- [x] 갤러리 이미지 선택 로직 구현 (expo-image-picker)
- [x] ReceiptPreview 컴포넌트 구현
- [x] 이미지 선택 후 미리보기 연결
- [x] PermissionDeniedView 컴포넌트 구현

**Deliverable**: 갤러리 선택 기능 완성 ✅

### Phase 4: 통합 및 지출 입력 폼
- [x] 영수증 미리보기 + 지출 입력 폼 통합 (expense/new.tsx에 통합)
- [x] "다시 촬영/선택" 기능 구현
- [x] app/expense/new.tsx 수정 (새 플로우 적용)
- [x] 지출 저장 로직 연결 (기존 createExpense 활용)
- [x] 저장/취소 시 임시 이미지 삭제 로직

**Deliverable**: 영수증 첨부 지출 등록 완료 ✅

### Phase 5: 테스트 및 마무리
- [x] 앱 시작 시 오래된 캐시 정리 로직 추가 (_layout.tsx)
- [x] TypeScript 타입 체크 통과 확인
- [ ] iOS 시뮬레이터에서 권한 테스트
- [ ] Android 에뮬레이터에서 권한 테스트
- [ ] 카메라/갤러리 기능 통합 테스트
- [ ] 에러 핸들링 검증

**Deliverable**: 안정적인 영수증 입력 기능 배포 준비

## Dependencies

```
Phase 1 ─────┬───► Phase 2
             │
             └───► Phase 3
                      │
Phase 2 ─────────────┬┘
                     │
                     ▼
                Phase 4 ───► Phase 5
```

## Progress

| Metric | Value |
|--------|-------|
| Total Tasks | 22/26 |
| Current Phase | Phase 5 |
| Status | completed (테스트 대기) |

## Execution Log

| Timestamp | Phase | Task | Status |
|-----------|-------|------|--------|
| 2026-01-28 | Phase 1 | expo-camera, expo-image-picker, expo-file-system 설치 | ✅ completed |
| 2026-01-28 | Phase 1 | app.json 권한 설정 | ✅ completed |
| 2026-01-28 | Phase 1 | lib/types.ts 타입 추가 | ✅ completed |
| 2026-01-28 | Phase 1 | lib/utils/image.ts 생성 | ✅ completed |
| 2026-01-28 | Phase 1 | ExpenseInputMethodSelector 구현 | ✅ completed |
| 2026-01-28 | Phase 1 | ReceiptInputOptions 구현 | ✅ completed |
| 2026-01-28 | Phase 2 | 카메라 권한 요청 로직 | ✅ completed |
| 2026-01-28 | Phase 2 | 권한 거부 시 설정 이동 | ✅ completed |
| 2026-01-28 | Phase 2 | ReceiptCamera 구현 | ✅ completed |
| 2026-01-28 | Phase 3 | 갤러리 권한 요청 로직 | ✅ completed |
| 2026-01-28 | Phase 3 | ReceiptPreview 구현 | ✅ completed |
| 2026-01-28 | Phase 3 | PermissionDeniedView 구현 | ✅ completed |
| 2026-01-28 | Phase 4 | expense/new.tsx 리팩토링 | ✅ completed |
| 2026-01-28 | Phase 4 | 다시 촬영/선택 기능 | ✅ completed |
| 2026-01-28 | Phase 4 | 임시 이미지 삭제 로직 | ✅ completed |
| 2026-01-28 | Phase 5 | 캐시 정리 로직 (_layout.tsx) | ✅ completed |
| 2026-01-28 | Phase 5 | TypeScript 타입 체크 | ✅ passed |

## Notes

- **카메라/갤러리 권한**: iOS와 Android 모두 런타임 권한 요청 필요
- **이미지 최적화**: 촬영/선택 시 자동 리사이징 및 압축 (quality: 0.8)
- **expo-file-system**: 새 API 사용 (File, Directory, Paths)
- **테스트**: 실제 디바이스에서 카메라 테스트 권장 (시뮬레이터 제한)

## Created Files

| Path | Description |
|------|-------------|
| `components/expense/index.ts` | 컴포넌트 export |
| `components/expense/ExpenseInputMethodSelector.tsx` | 입력 방식 선택 UI |
| `components/expense/ReceiptInputOptions.tsx` | 영수증 입력 옵션 UI |
| `components/expense/ReceiptCamera.tsx` | 카메라 촬영 화면 |
| `components/expense/ReceiptPreview.tsx` | 영수증 미리보기 |
| `components/expense/PermissionDeniedView.tsx` | 권한 거부 안내 |
| `lib/utils/image.ts` | 이미지 유틸리티 함수 |

## Modified Files

| Path | Changes |
|------|---------|
| `app.json` | 카메라/갤러리 권한 설정 추가 |
| `lib/types.ts` | ReceiptImage, ExpenseInputMethod 등 타입 추가 |
| `app/expense/new.tsx` | 영수증/직접 입력 분기 플로우 적용 |
| `app/_layout.tsx` | 캐시 정리 로직 추가 |
