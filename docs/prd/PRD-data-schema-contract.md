# PRD: Unified Data Schema Contract

> **Version**: 1.1
> **Status**: Draft
> **Date**: 2026-01-26
> **Scope**: Frontend (Mobile) / Backend (API) / AI-Engine 간 공유 데이터 스키마 정의
> **Package**: `@wigtn/shared`
>
> **문서 계층 관계**:
> - PRD v1.1 (Frontend) → 오프라인 전용 MVP 정의 (v3에 의해 확장됨)
> - PRD v3.0 (Backend+AI) → 서버 연동 확장 기능 정의
> - **이 문서 (Data Schema Contract)** → 위 두 PRD의 데이터 구조를 통합하는 **정본(SSOT)**
> - 충돌 시 이 문서가 우선. v1.1과 v3.0은 기능 요구사항 참조용

---

## 1. 개요

### 1.1 목적

세 개의 독립된 서비스(Mobile, API, AI-Engine)가 **동일한 데이터 구조**를 사용하도록 Single Source of Truth(SSOT)를 정의한다.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │     │   Backend   │     │  AI-Engine  │
│  (Expo/TS)  │◄───►│  (NestJS)   │◄───►│  (Python)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────┬───────┘                   │
                   ▼                           │
          @wigtn/shared (TS)                   │
          ─ Types & DTOs ─                     │
          ─ Constants    ─                     │
          ─ Validators   ─                     │
                   │                           │
                   └──── JSON Schema ──────────┘
                         (auto-gen)
```

### 1.2 현재 문제점 (불일치 현황)

| 항목 | Mobile (`types.ts`) | Shared (`@wigtn/shared`) | Backend DTO | AI-Engine (Pydantic) |
|------|--------------------|-----------------------|-------------|---------------------|
| Expense 날짜 필드 | `date` | `expenseDate` | `expenseDate` | N/A |
| Expense 시간 필드 | `time` | `expenseTime` | `expenseTime` | N/A |
| Expense 영수증 | `receiptImage` | `receiptImageUrl` | N/A | N/A |
| Expense 설명 | 없음 (`memo`만 존재) | `description` + `memo` | `description` + `memo` | N/A |
| Trip.endDate | required (`string`) | optional (`string?`) | optional | N/A |
| Trip.userId | 없음 | 있음 | JWT에서 추출 | N/A |
| Trip.status | 없음 | 있음 | 있음 | N/A |
| Trip.budgetCurrency | 없음 | 있음 | 있음 | N/A |
| WalletBalance | `transactions[]` 포함 | `transactions` 없음 | N/A | N/A |
| ExpenseStats | 기본 필드만 | `avgPerDay`, `maxDay` 등 추가 | N/A | N/A |
| Chat Request | N/A | `tripId`, `conversationId` | `tripId` | `context`, `history` |
| Receipt Request | N/A | `tripId` (required) | `tripId` (optional) | `tripId` 없음 |
| **Mobile이 @wigtn/shared 사용 여부** | **사용 안 함 (자체 타입)** | - | - | - |

### 1.3 해결 방향

1. `@wigtn/shared`를 SSOT로 확정
2. Mobile이 자체 `types.ts` 대신 `@wigtn/shared`를 import
3. AI-Engine용 JSON Schema를 `@wigtn/shared`에서 자동 생성
4. 각 레이어별 확장 타입은 해당 레이어에서 관리 (DB 전용 필드, UI 전용 필드 등)

---

## 2. 타입 아키텍처

### 2.1 레이어 구분

```
@wigtn/shared (Single Source of Truth)
├── Entity Types       : 모든 레이어가 공유하는 핵심 엔티티
├── DTO Types          : API 요청/응답에 사용하는 데이터 전송 객체
├── Enum / Constants   : 카테고리, 상태, 통화 등 열거형
├── API Contract       : API 응답 래퍼, 페이지네이션, 에러 형식
└── AI Contract        : AI 서비스 요청/응답 인터페이스

@wigtn/mobile (확장)
├── UI State Types     : Zustand 스토어 상태 타입
├── SQLite Mapper      : 로컬 DB ↔ Entity 변환
└── Navigation Types   : 라우팅 파라미터

@wigtn/api (확장)
├── Prisma Types       : @prisma/client 자동 생성
├── NestJS DTOs        : class-validator 데코레이터 적용
└── Service Types      : 비즈니스 로직 전용

ai-service (확장)
├── Pydantic Models    : JSON Schema에서 자동/수동 매핑
├── ML Pipeline Types  : 모델 추론 전용
└── Provider Types     : LLM/VLM 공급자별 설정
```

### 2.2 타입 흐름도

```
[사용자 입력]
    │
    ▼
CreateExpenseDto (Mobile → API 요청)
    │
    ▼
Expense Entity (API 내부 처리 + DB 저장)
    │
    ▼
ExpenseResponse (API → Mobile 응답)
    │
    ▼
ExpenseWithUI (Mobile UI 렌더링)
```

---

## 3. Canonical Entity Definitions (정규 엔티티)

> 모든 엔티티의 기준 정의. 각 레이어는 이 정의를 기반으로 확장한다.

### 3.1 공통 Base

```typescript
// @wigtn/shared/types/common.ts

/** 모든 엔티티의 기본 필드 */
export interface BaseEntity {
  id: string;                 // UUID v4
  createdAt: string;          // ISO 8601 (e.g., "2025-01-15T09:30:00.000Z")
  updatedAt?: string;         // ISO 8601
}

/** 페이지네이션 요청 */
export interface PaginationParams {
  page?: number;              // default: 1
  limit?: number;             // default: 20, max: 100
  sortBy?: string;            // 정렬 필드
  sortOrder?: 'asc' | 'desc'; // default: 'desc'
}

/** 페이지네이션 응답 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 3.2 User

```typescript
// @wigtn/shared/types/user.ts

export type AuthProvider = 'local' | 'apple' | 'google';

export interface User extends BaseEntity {
  email: string;
  name: string;
  provider: AuthProvider;
  // passwordHash는 API 내부 전용 - 절대 공유하지 않음
}

/** 회원가입 */
export interface RegisterDto {
  email: string;
  password: string;           // min: 8, max: 100
  name: string;               // min: 1, max: 100
}

/** 로그인 */
export interface LoginDto {
  email: string;
  password: string;
}

/** 소셜 로그인 */
export interface SocialLoginDto {
  provider: 'apple' | 'google';
  idToken: string;
}

/** 인증 토큰 응답 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;          // seconds (e.g., 900 = 15분)
}

/** 인증 후 사용자 정보 응답 */
export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

/** 비밀번호 재설정 요청 (이메일로 코드 전송) */
export interface ForgotPasswordDto {
  email: string;
}

/** 비밀번호 재설정 실행 */
export interface ResetPasswordDto {
  email: string;
  code: string;               // 이메일로 받은 6자리 코드
  newPassword: string;         // min: 8, max: 100
}

/** 토큰 갱신 요청 */
export interface RefreshTokenDto {
  refreshToken: string;
}
```

### 3.3 Trip

```typescript
// @wigtn/shared/types/trip.ts

export type TripStatus = 'active' | 'completed' | 'cancelled';

export interface Trip extends BaseEntity {
  userId: string;
  name: string;               // max: 200
  startDate: string;          // YYYY-MM-DD
  endDate?: string;           // YYYY-MM-DD (optional: 편도/무기한 여행)
  budget?: number;            // Decimal(15,2) - 총 예산
  budgetCurrency: string;     // default: "KRW", VarChar(3)
  status: TripStatus;         // default: "active"
  coverImage?: string;        // 이미지 URL 또는 로컬 경로
}

export interface Destination extends BaseEntity {
  tripId: string;
  countryCode: string;        // ISO 3166-1 alpha-2 (e.g., "JP", "FR", "TH")
  country: string;            // max: 100, 표시명 (e.g., "일본", "프랑스")
  city?: string;              // max: 100 (e.g., "파리")
  currency: SupportedCurrency;// VarChar(3)
  startDate?: string;         // YYYY-MM-DD
  endDate?: string;           // YYYY-MM-DD
  orderIndex: number;         // 방문 순서 (0-based)
}

/** 여행 상세 조회 응답 (집계 포함) */
export interface TripWithDetails extends Trip {
  destinations: Destination[];
  totalExpenseKRW: number;    // 총 지출 원화 환산
  expenseCount: number;       // 지출 건수
}

// ─── DTOs ───

export interface CreateTripDto {
  name: string;
  startDate: string;          // YYYY-MM-DD
  endDate?: string;
  budget?: number;
  budgetCurrency?: string;    // default: "KRW"
  destinations: CreateDestinationDto[];
}

export interface UpdateTripDto {
  name?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  budgetCurrency?: string;
  status?: TripStatus;
  coverImage?: string;
}

export interface CreateDestinationDto {
  countryCode: string;        // ISO 3166-1 alpha-2
  country: string;            // 표시명
  city?: string;
  currency: SupportedCurrency;
  startDate?: string;
  endDate?: string;
  orderIndex?: number;
}

export interface UpdateDestinationDto {
  countryCode?: string;
  country?: string;
  city?: string;
  currency?: SupportedCurrency;
  startDate?: string;
  endDate?: string;
  orderIndex?: number;
}
```

### 3.4 Expense

```typescript
// @wigtn/shared/types/expense.ts

export type Category = 'food' | 'transport' | 'shopping' | 'lodging' | 'activity' | 'etc';
export type PaymentMethod = 'card' | 'cash';

export interface Expense extends BaseEntity {
  tripId: string;
  userId: string;
  destinationId?: string;

  // 금액
  amount: number;             // Decimal(15,2) - 현지 통화 금액
  currency: string;           // VarChar(3)
  exchangeRate: number;       // Decimal(15,6) - 1 외화 = X KRW
  amountKRW: number;          // Decimal(15,2) - 원화 환산

  // 분류
  category: Category;
  paymentMethod: PaymentMethod;

  // 상세
  description?: string;       // max: 500 (장소명 등 짧은 설명)
  memo?: string;              // max: 1000 (자유 메모)
  expenseDate: string;        // YYYY-MM-DD
  expenseTime?: string;       // HH:mm

  // OCR
  receiptImageUrl?: string;   // 영수증 이미지 URL
  ocrProcessed: boolean;      // default: false
  ocrConfidence?: number;     // 0.00 ~ 1.00
}

// ─── DTOs ───

/**
 * 지출 생성 요청
 * - exchangeRate, amountKRW: 클라이언트에서 환율 계산 후 전송
 *   (서버에서 환율 API로 검증 가능)
 */
export interface CreateExpenseDto {
  tripId: string;
  destinationId?: string;

  amount: number;
  currency: string;
  exchangeRate: number;
  amountKRW: number;

  category: Category;
  paymentMethod: PaymentMethod;

  description?: string;
  memo?: string;
  expenseDate: string;        // YYYY-MM-DD
  expenseTime?: string;       // HH:mm
}

export interface UpdateExpenseDto {
  amount?: number;
  currency?: string;
  exchangeRate?: number;
  amountKRW?: number;

  category?: Category;
  paymentMethod?: PaymentMethod;

  description?: string;
  memo?: string;
  expenseDate?: string;
  expenseTime?: string;
  destinationId?: string;
}

/** 지출 필터/검색 */
export interface ExpenseFilterParams extends PaginationParams {
  tripId: string;
  destinationId?: string;
  category?: Category;
  paymentMethod?: PaymentMethod;
  startDate?: string;         // YYYY-MM-DD
  endDate?: string;           // YYYY-MM-DD
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
}

/** 지출 통계 (대시보드용) */
export interface ExpenseStats {
  totalKRW: number;
  totalLocal: Record<string, number>;
  byCategory: Record<Category, number>;
  byDate: Record<string, number>;
  byDestination: Record<string, number>;
  byCurrency: Record<string, {
    amount: number;
    amountKRW: number;
  }>;
  avgPerDay: number;
  maxDay: { date: string; amount: number } | null;
  maxCategory: { category: Category; amount: number } | null;
}
```

> **Note (Wallet/지갑 제거)**
> PRD v1.1에서 지갑/환전 관리는 Non-Goal로 명시됨.
> v3 PRD에 Wallet이 포함되어 있으나, 핵심 MVP에서는 제외.
> Wallet 관련 타입은 `@wigtn/shared/types/wallet.ts`에 유지하되,
> **이 Data Schema Contract에서는 MVP 범위인 Trip/Expense/AI에 집중한다.**
> Wallet 기능 추가 시 별도 PRD에서 스키마를 확장한다.

### 3.5 Exchange Rate (환율)

```typescript
// @wigtn/shared/types/exchange-rate.ts

export type SupportedCurrency =
  | 'JPY' | 'USD' | 'EUR' | 'GBP' | 'CNY'
  | 'THB' | 'VND' | 'TWD' | 'PHP' | 'SGD'
  | 'AUD' | 'CAD' | 'CHF' | 'CZK' | 'HKD'
  | 'MYR' | 'NZD' | 'IDR';

export const HOME_CURRENCY = 'KRW' as const;

/** 환율 정보 (캐시 포함) */
export interface ExchangeRates {
  base: string;               // default: "KRW"
  rates: Record<string, number>; // { "USD": 1350.50, "JPY": 9.12, ... }
  lastUpdated: string;        // ISO 8601
}

/** 환율 변환 요청 */
export interface ConvertCurrencyDto {
  from: string;               // 원본 통화
  to: string;                 // 대상 통화
  amount: number;
}

/** 환율 변환 응답 */
export interface ConvertCurrencyResponse {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
}
```

### 3.6 AI - Receipt OCR

```typescript
// @wigtn/shared/types/ai.ts

/** 영수증 개별 항목 */
export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;           // default: 1
}

/** 영수증 OCR 분석 결과 */
export interface ReceiptAnalysis {
  store: string;              // 매장명
  date: string;               // YYYY-MM-DD
  time?: string;              // HH:mm
  items: ReceiptItem[];
  subtotal?: number;
  tax?: number;
  total: number;
  currency: string;           // VarChar(3)
  category: Category;         // AI가 추론한 카테고리
  confidence: number;         // 0.0 ~ 1.0
  rawText?: string;           // OCR 원본 텍스트
}

// ─── Mobile → Backend 요청 ───

/** 영수증 분석 요청 (Mobile → Backend) */
export interface AnalyzeReceiptRequestDto {
  image: string;              // Base64 encoded image
  mimeType: string;           // "image/jpeg" | "image/png" | "image/webp"
  tripId: string;             // 여행 ID (지출 자동 연결용)
  destinationId?: string;     // 방문지 ID
}

/** 영수증 분석 응답 (Backend → Mobile) */
export interface AnalyzeReceiptResponseDto {
  success: boolean;
  analysis: ReceiptAnalysis | null;
  suggestedExpense?: CreateExpenseDto; // AI가 추천하는 지출 입력값
  error?: string;
}

// ─── Backend → AI-Engine 요청 (내부 API) ───

/** 영수증 분석 요청 (Backend → AI-Engine) */
export interface AIReceiptRequest {
  image: string;              // Base64 encoded image
  mimeType: string;
}

/** 영수증 분석 응답 (AI-Engine → Backend) */
export interface AIReceiptResponse {
  success: boolean;
  analysis: ReceiptAnalysis | null;
  error?: string;
}
```

### 3.7 AI - Chatbot

```typescript
// @wigtn/shared/types/ai.ts (계속)

/** 챗 메시지 역할 */
export type ChatRole = 'user' | 'assistant' | 'system';

/** 챗 메시지 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// ─── Mobile → Backend 요청 ───

/** 챗봇 요청 (Mobile → Backend) */
export interface ChatRequestDto {
  message: string;            // max: 2000
  tripId?: string;            // 여행 컨텍스트 (지출 분석 등)
  conversationId?: string;    // 이전 대화 이어가기
}

/** 챗봇 응답 (Backend → Mobile) */
export interface ChatResponseDto {
  message: string;
  conversationId: string;
  suggestions?: string[];     // 후속 질문 추천
}

// ─── Backend → AI-Engine 요청 (내부 API) ───

/** 챗 요청 (Backend → AI-Engine) */
export interface AIChatRequest {
  message: string;
  context?: string;           // Backend가 구성한 컨텍스트 (여행/지출 요약)
  history?: ChatMessage[];    // 이전 대화 히스토리
}

/** 챗 응답 (AI-Engine → Backend) */
export interface AIChatResponse {
  message: string;
  tokensUsed?: number;
}

/** AI Provider 설정 (Backend 내부 전용이나, 설정 타입 공유) */
export type AIProviderType = 'self-hosted' | 'openai' | 'groq' | 'anthropic';

export interface AIProviderConfig {
  type: AIProviderType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}
```

### 3.8 API Response Wrapper

```typescript
// @wigtn/shared/types/api.ts

/** 성공 응답 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/** 에러 응답 */
export interface ApiError {
  success: false;
  error: {
    code: string;             // e.g., "VALIDATION_ERROR", "NOT_FOUND"
    message: string;          // 사용자 표시용
    details?: Record<string, unknown>; // 개발자용 상세
  };
}

/** API 결과 (성공 | 실패) */
export type ApiResult<T> = ApiResponse<T> | ApiError;

/** 표준 에러 코드 */
export type ErrorCode =
  | 'VALIDATION_ERROR'        // 400
  | 'UNAUTHORIZED'            // 401
  | 'FORBIDDEN'               // 403
  | 'NOT_FOUND'               // 404
  | 'CONFLICT'                // 409
  | 'RATE_LIMIT'              // 429
  | 'INTERNAL_ERROR'          // 500
  | 'AI_SERVICE_ERROR'        // 503
  | 'EXCHANGE_RATE_ERROR';    // 503
```

---

## 4. Constants (상수 정의)

```typescript
// @wigtn/shared/constants.ts

// ─── Category ───

export const CATEGORIES = ['food', 'transport', 'shopping', 'lodging', 'activity', 'etc'] as const;

export const CATEGORY_LABELS: Record<Category, string> = {
  food: '식비',
  transport: '교통',
  shopping: '쇼핑',
  lodging: '숙박',
  activity: '관광',
  etc: '기타',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  food: 'restaurant',
  transport: 'directions-bus',
  shopping: 'shopping-bag',
  lodging: 'hotel',
  activity: 'local-activity',
  etc: 'more-horiz',
};

// ─── Payment Method ───

export const PAYMENT_METHODS = ['card', 'cash'] as const;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: '카드',
  cash: '현금',
};

// ─── Trip Status ───

export const TRIP_STATUSES = ['active', 'completed', 'cancelled'] as const;

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  active: '여행 중',
  completed: '완료',
  cancelled: '취소',
};

// ─── Supported Currencies ───

export const SUPPORTED_CURRENCIES = [
  'JPY', 'USD', 'EUR', 'GBP', 'CNY',
  'THB', 'VND', 'TWD', 'PHP', 'SGD',
  'AUD', 'CAD', 'CHF', 'CZK', 'HKD',
  'MYR', 'NZD', 'IDR',
] as const;

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  JPY: '일본 엔',
  USD: '미국 달러',
  EUR: '유로',
  GBP: '영국 파운드',
  CNY: '중국 위안',
  THB: '태국 바트',
  VND: '베트남 동',
  TWD: '대만 달러',
  PHP: '필리핀 페소',
  SGD: '싱가포르 달러',
  AUD: '호주 달러',
  CAD: '캐나다 달러',
  CHF: '스위스 프랑',
  CZK: '체코 코루나',
  HKD: '홍콩 달러',
  MYR: '말레이시아 링깃',
  NZD: '뉴질랜드 달러',
  IDR: '인도네시아 루피아',
};

// ─── Validation Rules ───

export const VALIDATION = {
  TRIP_NAME_MAX: 200,
  COUNTRY_MAX: 100,
  CITY_MAX: 100,
  DESCRIPTION_MAX: 500,
  MEMO_MAX: 1000,
  CHAT_MESSAGE_MAX: 2000,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 100,
  USER_NAME_MAX: 100,
  CURRENCY_LENGTH: 3,
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 100,
} as const;
```

---

## 5. 레이어별 매핑 가이드

### 5.1 Mobile (Expo/TypeScript)

#### 변경 사항: 자체 `types.ts` → `@wigtn/shared` import

```typescript
// apps/mobile/lib/types.ts (기존 파일 → @wigtn/shared re-export + UI 전용 타입만 유지)

// 공유 타입은 @wigtn/shared에서 가져옴
export type {
  Trip,
  TripWithDetails,
  Destination,
  Expense,
  ExpenseStats,
  ExchangeRates,
  Category,
  PaymentMethod,
  TripStatus,
  SupportedCurrency,
  CreateTripDto,
  CreateDestinationDto,
  CreateExpenseDto,
  UpdateExpenseDto,
  ChatRequestDto,
  ChatResponseDto,
  AnalyzeReceiptRequestDto,
  AnalyzeReceiptResponseDto,
} from '@wigtn/shared';

// ─── Mobile 전용 타입 (UI/Navigation) ───

/** 현재 위치 정보 (날짜 기반 자동 감지) */
export interface CurrentLocation {
  destination: Destination | null;
  dayIndex: number;
}

/** SQLite 로컬 저장용 (오프라인) */
export interface LocalExpenseRow {
  id: string;
  trip_id: string;
  data_json: string;          // JSON.stringify(CreateExpenseDto)
  synced: 0 | 1;              // SQLite boolean
  created_at: string;
}
```

#### 필드 마이그레이션 (Mobile)

| 기존 (mobile) | 변경 후 (shared) | 비고 |
|---------------|-----------------|------|
| `expense.date` | `expense.expenseDate` | 필드명 통일 |
| `expense.time` | `expense.expenseTime` | 필드명 통일 |
| `expense.receiptImage` | `expense.receiptImageUrl` | 필드명 통일 |
| `trip.endDate` (required) | `trip.endDate` (optional) | 편도 여행 지원 |
| (없음) | `trip.userId` | 인증 후 서버에서 주입 |
| (없음) | `trip.status` | 여행 상태 관리 |
| (없음) | `trip.budgetCurrency` | 다중 통화 예산 |
| (없음) | `expense.description` | 장소명 등 짧은 설명 추가 |

### 5.2 Backend (NestJS/Prisma)

#### Prisma Schema ↔ Shared Type 매핑

```
Prisma Model          →  Shared Entity Type     →  NestJS DTO (class-validator)
─────────────────────────────────────────────────────────────────────────────────
model User            →  User                   →  RegisterDto, LoginDto
model Trip            →  Trip                   →  CreateTripDto, UpdateTripDto
model Destination     →  Destination            →  CreateDestinationDto
model Expense         →  Expense                →  CreateExpenseDto, UpdateExpenseDto
model ExchangeRate    →  ExchangeRates          →  ConvertCurrencyDto
model ChatMessage     →  ChatMessage            →  ChatRequestDto
```

#### NestJS DTO에서 Shared 타입 활용

```typescript
// apps/api/src/modules/expense/dto/create-expense.dto.ts

import { CreateExpenseDto as ICreateExpenseDto, VALIDATION } from '@wigtn/shared';

// NestJS DTO는 class-validator 데코레이터가 필요하므로 class로 구현하되,
// Shared 인터페이스를 implements 하여 타입 일관성 보장
export class CreateExpenseDto implements ICreateExpenseDto {
  @IsString()
  tripId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @MaxLength(VALIDATION.CURRENCY_LENGTH)
  currency: string;

  @IsNumber()
  exchangeRate: number;

  @IsNumber()
  amountKRW: number;

  @IsIn(CATEGORIES)
  category: Category;

  @IsIn(PAYMENT_METHODS)
  paymentMethod: PaymentMethod;

  // ... (Shared 인터페이스의 모든 필드 구현)
}
```

### 5.3 AI-Engine (Python/FastAPI)

#### Pydantic Model ↔ Shared Type 매핑

JSON으로 통신하므로, 필드명은 camelCase를 유지한다 (Python snake_case 변환은 Pydantic alias로 처리).

```python
# apps/ai-service/app/models/receipt.py

from pydantic import BaseModel, Field
from typing import Optional

class ReceiptItem(BaseModel):
    """@wigtn/shared ReceiptItem과 동일"""
    name: str
    price: float
    quantity: int = 1

class ReceiptAnalysis(BaseModel):
    """@wigtn/shared ReceiptAnalysis와 동일"""
    store: str
    date: str                                  # YYYY-MM-DD
    time: Optional[str] = None                 # HH:mm
    items: list[ReceiptItem]
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: float
    currency: str
    category: str                              # Category enum value
    confidence: float                          # 0.0 ~ 1.0
    raw_text: Optional[str] = Field(None, alias="rawText")

    class Config:
        populate_by_name = True                # snake_case & camelCase 모두 허용

class AIReceiptRequest(BaseModel):
    """@wigtn/shared AIReceiptRequest와 동일
    Backend에서 tripId/destinationId를 제거하고 순수 이미지만 전달"""
    image: str                                 # Base64
    mime_type: str = Field(alias="mimeType")

class AIReceiptResponse(BaseModel):
    """@wigtn/shared AIReceiptResponse와 동일"""
    success: bool
    analysis: Optional[ReceiptAnalysis] = None
    error: Optional[str] = None
```

```python
# apps/ai-service/app/models/chat.py

from pydantic import BaseModel, Field
from typing import Optional

class ChatMessage(BaseModel):
    """@wigtn/shared ChatMessage와 동일"""
    role: str                                  # "user" | "assistant" | "system"
    content: str

class AIChatRequest(BaseModel):
    """@wigtn/shared AIChatRequest와 동일"""
    message: str
    context: Optional[str] = None
    history: Optional[list[ChatMessage]] = None

class AIChatResponse(BaseModel):
    """@wigtn/shared AIChatResponse와 동일"""
    message: str
    tokens_used: Optional[int] = Field(None, alias="tokensUsed")
```

---

## 6. API Endpoint ↔ DTO 매핑 테이블

### 6.1 Auth

| Method | Endpoint | Request DTO | Response DTO |
|--------|----------|-------------|--------------|
| POST | `/auth/register` | `RegisterDto` | `ApiResponse<AuthResponse>` |
| POST | `/auth/login` | `LoginDto` | `ApiResponse<AuthResponse>` |
| POST | `/auth/social` | `SocialLoginDto` | `ApiResponse<AuthResponse>` |
| POST | `/auth/refresh` | `RefreshTokenDto` | `ApiResponse<AuthTokens>` |
| POST | `/auth/logout` | `RefreshTokenDto` | `ApiResponse<{ message: string }>` |
| GET | `/auth/me` | - | `ApiResponse<User>` |
| POST | `/auth/forgot-password` | `ForgotPasswordDto` | `ApiResponse<{ message: string }>` |
| POST | `/auth/reset-password` | `ResetPasswordDto` | `ApiResponse<{ message: string }>` |

### 6.2 Trip

| Method | Endpoint | Request DTO | Response DTO |
|--------|----------|-------------|--------------|
| GET | `/trips` | `PaginationParams` | `ApiResponse<PaginatedResponse<TripWithDetails>>` |
| GET | `/trips/:id` | - | `ApiResponse<TripWithDetails>` |
| POST | `/trips` | `CreateTripDto` | `ApiResponse<TripWithDetails>` |
| PATCH | `/trips/:id` | `UpdateTripDto` | `ApiResponse<TripWithDetails>` |
| DELETE | `/trips/:id` | - | `ApiResponse<{ message: string }>` |

### 6.3 Destination

| Method | Endpoint | Request DTO | Response DTO |
|--------|----------|-------------|--------------|
| POST | `/trips/:tripId/destinations` | `CreateDestinationDto` | `ApiResponse<Destination>` |
| PATCH | `/trips/:tripId/destinations/:id` | `UpdateDestinationDto` | `ApiResponse<Destination>` |
| DELETE | `/trips/:tripId/destinations/:id` | - | `ApiResponse<{ message: string }>` |

### 6.4 Expense

| Method | Endpoint | Request DTO | Response DTO |
|--------|----------|-------------|--------------|
| GET | `/trips/:tripId/expenses` | `ExpenseFilterParams` | `ApiResponse<PaginatedResponse<Expense>>` |
| GET | `/trips/:tripId/expenses/stats` | - | `ApiResponse<ExpenseStats>` |
| POST | `/trips/:tripId/expenses` | `CreateExpenseDto` | `ApiResponse<Expense>` |
| PATCH | `/trips/:tripId/expenses/:id` | `UpdateExpenseDto` | `ApiResponse<Expense>` |
| DELETE | `/trips/:tripId/expenses/:id` | - | `ApiResponse<{ message: string }>` |

### 6.5 AI

| Method | Endpoint | Request DTO | Response DTO |
|--------|----------|-------------|--------------|
| POST | `/ai/receipt/analyze` | `AnalyzeReceiptRequestDto` | `ApiResponse<AnalyzeReceiptResponseDto>` |
| POST | `/ai/chat` | `ChatRequestDto` | `ApiResponse<ChatResponseDto>` |
| GET | `/ai/chat/history` | `{ tripId?: string }` | `ApiResponse<ChatMessage[]>` |

### 6.6 Exchange Rate

| Method | Endpoint | Request DTO | Response DTO |
|--------|----------|-------------|--------------|
| GET | `/exchange-rates` | - | `ApiResponse<ExchangeRates>` |
| POST | `/exchange-rates/convert` | `ConvertCurrencyDto` | `ApiResponse<ConvertCurrencyResponse>` |

---

## 7. 데이터 흐름 다이어그램

### 7.1 지출 등록 (수동)

```
Mobile                          Backend (API)                    DB
──────                          ─────────────                    ──
1. 사용자 입력
2. 환율 조회 (캐시/API)
3. CreateExpenseDto 구성
   {
     tripId, amount, currency,
     exchangeRate, amountKRW,
     category, paymentMethod,
     description, memo,
     expenseDate, expenseTime
   }
        ──── POST /expenses ────►
                                4. JWT에서 userId 추출
                                5. DTO Validation (class-validator)
                                6. 환율 검증 (±5% 허용)
                                7. Prisma create
                                        ──── INSERT ────►
                                                         8. Expense row 생성
                                        ◄─── Expense ────
                                9. Expense entity 응답
        ◄── ApiResponse<Expense> ──
10. Zustand store 업데이트
11. UI 갱신
```

### 7.2 영수증 OCR

```
Mobile                   Backend (API)              AI-Engine              DB
──────                   ─────────────              ─────────              ──
1. 카메라/갤러리
2. 이미지 → Base64
3. AnalyzeReceiptRequestDto
   {
     image, mimeType,
     tripId, destinationId
   }
     ── POST /ai/receipt ──►
                          4. JWT 인증
                          5. tripId 유효성 검증
                          6. AIReceiptRequest 구성
                             { image, mimeType }
                              ── POST /analyze ──►
                                                 7. VLM 추론 (Qwen2-VL)
                                                 8. ReceiptAnalysis 구성
                              ◄─ AIReceiptResponse ─
                          9. ReceiptAnalysis → CreateExpenseDto 변환
                          10. suggestedExpense 구성
     ◄── AnalyzeReceiptResponseDto ──
12. 사용자 확인/수정
13. CreateExpenseDto 전송
     ── POST /expenses ──►
                          14. 일반 지출 생성 플로우
                          15. ocrProcessed=true 설정
```

### 7.3 챗봇

```
Mobile                   Backend (API)              AI-Engine
──────                   ─────────────              ─────────
1. 메시지 입력
2. ChatRequestDto
   {
     message, tripId,
     conversationId
   }
     ── POST /ai/chat ──►
                          3. JWT 인증
                          4. tripId → 여행/지출 데이터 조회
                          5. 컨텍스트 문자열 구성
                          6. 이전 대화 히스토리 조회
                          7. AIChatRequest 구성
                             {
                               message,
                               context: "여행: 유럽, 총지출: 150만원...",
                               history: [...]
                             }
                              ── POST /chat ──►
                                              8. LLM 추론
                                              9. 응답 생성
                              ◄─ AIChatResponse ─
                          10. ChatMessage DB 저장
                          11. ChatResponseDto 구성
     ◄── ApiResponse<ChatResponseDto> ──
12. 채팅 UI 업데이트
```

---

## 8. 구현 우선순위

### Phase 1: Schema 통합 (기반 작업)

- [ ] `@wigtn/shared` 타입을 이 문서 기준으로 업데이트
- [ ] `PaymentMethod`에서 `'wallet'` 제거 (MVP 범위 외)
- [ ] `ExpenseFilterParams`, `UpdateTripDto`, `UpdateDestinationDto` 추가
- [ ] `ErrorCode` 상수 추가
- [ ] `VALIDATION` 상수 추가
- [ ] AI 타입을 Mobile↔Backend / Backend↔AI-Engine 2단계로 분리

### Phase 2: Mobile 마이그레이션

- [ ] `apps/mobile/lib/types.ts` → `@wigtn/shared` import로 전환
- [ ] `date` → `expenseDate`, `time` → `expenseTime` 필드명 변경
- [ ] `receiptImage` → `receiptImageUrl` 필드명 변경
- [ ] `Trip`에 `userId`, `status`, `budgetCurrency` 필드 반영
- [ ] `Expense`에 `description` 필드 추가
- [ ] Zustand store 타입 업데이트
- [ ] SQLite 스키마 마이그레이션 (컬럼명 변경)

### Phase 3: Backend DTO 정합성

- [ ] NestJS DTO 클래스가 Shared 인터페이스를 `implements` 하도록 변경
- [ ] `VALIDATION` 상수를 DTO 데코레이터에서 활용
- [ ] `CATEGORIES`, `PAYMENT_METHODS` 상수를 `@IsIn()` 데코레이터에서 활용
- [ ] Prisma schema에서 Wallet 모델 주석 처리 (MVP 제외)

### Phase 4: AI-Engine 정합성

- [ ] Python Pydantic 모델 필드를 이 문서 기준으로 정렬
- [ ] camelCase alias 설정 (JSON 통신 호환)
- [ ] `AIReceiptRequest` / `AIChatRequest` 분리 적용
- [ ] (선택) `@wigtn/shared`에서 JSON Schema 자동 생성 → Python 모델 검증

---

## 9. JSON Schema 자동 생성 (AI-Engine 호환)

TypeScript 타입 → JSON Schema 자동 생성으로 Python 모델과의 정합성을 보장한다.

### 도구

```jsonc
// packages/shared/package.json
{
  "scripts": {
    "generate:json-schema": "ts-json-schema-generator --path src/types/ai.ts --out dist/ai-schema.json"
  },
  "devDependencies": {
    "ts-json-schema-generator": "^2.3.0"
  }
}
```

### 생성 대상

| TypeScript Type | JSON Schema File | Python Consumer |
|----------------|-----------------|-----------------|
| `AIReceiptRequest` | `ai-receipt-request.json` | `AnalyzeReceiptRequest` |
| `AIReceiptResponse` | `ai-receipt-response.json` | `AnalyzeReceiptResponse` |
| `AIChatRequest` | `ai-chat-request.json` | `AIChatRequest` |
| `AIChatResponse` | `ai-chat-response.json` | `AIChatResponse` |
| `ReceiptAnalysis` | `receipt-analysis.json` | `ReceiptAnalysis` |

---

## 10. 규칙 및 컨벤션

### 10.1 필드 네이밍

| 규칙 | 예시 | 비고 |
|------|------|------|
| camelCase | `expenseDate`, `amountKRW` | TypeScript/JSON 기본 |
| snake_case 허용 | Python 내부만 | Pydantic alias로 변환 |
| 날짜: YYYY-MM-DD | `"2025-01-15"` | ISO 8601 date |
| 시간: HH:mm | `"14:30"` | 24시간 형식 |
| 타임스탬프: ISO 8601 | `"2025-01-15T09:30:00.000Z"` | UTC |
| 통화: ISO 4217 | `"KRW"`, `"USD"` | 3글자 대문자 |
| ID: UUID v4 | `"550e8400-e29b-..."` | 모든 엔티티 |

### 10.2 금액 처리

| 항목 | 타입 | 정밀도 | 비고 |
|------|------|--------|------|
| 현지 금액 (`amount`) | `number` | Decimal(15,2) | DB는 Decimal, API는 number |
| 환율 (`exchangeRate`) | `number` | Decimal(15,6) | 1 외화 = X KRW |
| 원화 환산 (`amountKRW`) | `number` | Decimal(15,2) | `amount * exchangeRate` |

### 10.3 타입 변경 절차

1. `@wigtn/shared`의 타입을 먼저 수정
2. `pnpm build --filter=@wigtn/shared`로 빌드
3. 빌드 에러가 발생하는 모든 consumer (mobile, api)를 수정
4. AI-Engine의 Pydantic 모델을 수동 동기화
5. (선택) JSON Schema 재생성으로 정합성 검증

### 10.4 삭제 정책

| 대상 | 방식 | 보존 기간 | 비고 |
|------|------|----------|------|
| Trip | Soft Delete (`deletedAt`) | 30일 후 Hard Delete | 사용자 복구 요청 대비 |
| Expense | Cascade (Trip 삭제 시) | Trip과 동일 | Trip에 종속 |
| Destination | Cascade | Trip과 동일 | Trip에 종속 |
| ChatMessage | Hard Delete | 즉시 | 대화 초기화 시 |
| User | Soft Delete | 90일 후 Hard Delete | GDPR 대응, 탈퇴 복구 |
| 영수증 이미지 | S3 삭제 | Expense 삭제 시 | lifecycle policy |

### 10.5 환율 검증 정책

```
클라이언트 제출 환율과 서버 환율 비교:
- ±10% 이내: 클라이언트 제출값 존중 (저장)
- ±10% 초과: 경고 응답 + 서버 환율 제안 (클라이언트가 재선택)
- 서버 환율 조회 실패: 클라이언트 제출값 신뢰 (저장)

이유: 사용자가 실제 환전한 환율과 시장 환율이 다를 수 있으므로
      사용자 입력을 우선 존중하되, 명백한 오류는 방지
```

---

## 11. 추가 타입 정의 (Digging 결과 반영)

### 11.1 이미지 업로드

```typescript
// @wigtn/shared/types/upload.ts

/** 이미지 업로드 전략: Presigned URL 방식
 *
 * Flow:
 * 1. Mobile → Backend: 업로드 URL 요청
 * 2. Backend → S3: presigned URL 생성
 * 3. Backend → Mobile: presigned URL + 최종 URL 반환
 * 4. Mobile → S3: 직접 업로드 (PUT)
 * 5. Mobile → Backend: 최종 URL을 엔티티에 저장
 */

export type ImagePurpose = 'receipt' | 'cover';
export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic';

/** 업로드 URL 요청 */
export interface RequestUploadUrlDto {
  purpose: ImagePurpose;
  mimeType: ImageMimeType;
  fileName: string;           // 원본 파일명
}

/** 업로드 URL 응답 */
export interface UploadUrlResponse {
  uploadUrl: string;          // S3 presigned PUT URL (5분 유효)
  fileUrl: string;            // 업로드 완료 후 접근 URL
  expiresIn: number;          // seconds
}

/** 이미지 제약 */
export const IMAGE_LIMITS = {
  MAX_SIZE_MB: 10,
  MAX_WIDTH: 4096,
  MAX_HEIGHT: 4096,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const,
} as const;
```

### 11.2 데이터 동기화 (Sync)

```typescript
// @wigtn/shared/types/sync.ts

/** 동기화 상태 */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'error';

/** 동기화 대상 엔티티 종류 */
export type SyncEntityType = 'trip' | 'destination' | 'expense';

/** 개별 변경 사항 */
export interface SyncChange {
  entityType: SyncEntityType;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>; // 엔티티 데이터
  localUpdatedAt: string;     // 로컬 수정 시간
}

/** 동기화 요청 (Mobile → Backend) */
export interface SyncPushDto {
  changes: SyncChange[];
  lastSyncedAt?: string;      // 마지막 동기화 시점
}

/** 동기화 응답 (Backend → Mobile) */
export interface SyncPushResponse {
  applied: string[];           // 성공적으로 적용된 entityId[]
  conflicts: SyncConflict[];   // 충돌 목록
  serverChanges: SyncChange[]; // 서버에서 변경된 항목 (pull)
  syncedAt: string;            // 동기화 완료 시점
}

/** 충돌 정보 */
export interface SyncConflict {
  entityType: SyncEntityType;
  entityId: string;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  localUpdatedAt: string;
  serverUpdatedAt: string;
}

/** 충돌 해결 요청 */
export interface SyncResolveConflictDto {
  entityType: SyncEntityType;
  entityId: string;
  resolution: 'keep_local' | 'keep_server';
}

/** 초기 마이그레이션 요청 (오프라인 데이터 → 서버) */
export interface MigrationUploadDto {
  trips: Record<string, unknown>[];
  destinations: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
}

/** 초기 마이그레이션 응답 */
export interface MigrationUploadResponse {
  imported: {
    trips: number;
    destinations: number;
    expenses: number;
  };
  conflicts: SyncConflict[];
  message: string;
}
```

### 11.3 배치 OCR

```typescript
// @wigtn/shared/types/ai.ts (추가)

/** 배치 영수증 분석 요청 (Mobile → Backend) */
export interface BatchAnalyzeReceiptRequestDto {
  receipts: AnalyzeReceiptRequestDto[];  // max: 10
}

/** 배치 영수증 분석 응답 (Backend → Mobile) */
export interface BatchAnalyzeReceiptResponseDto {
  results: AnalyzeReceiptResponseDto[];
  successCount: number;
  failCount: number;
}
```

### 11.4 스트리밍 챗봇

```typescript
// @wigtn/shared/types/ai.ts (추가)

/**
 * 스트리밍 챗봇 프로토콜: Server-Sent Events (SSE)
 *
 * Endpoint: POST /ai/chat/stream
 * Content-Type: text/event-stream
 *
 * 이벤트 형식:
 *   event: message
 *   data: {"type": "token", "content": "안녕"}
 *
 *   event: message
 *   data: {"type": "done", "conversationId": "xxx", "suggestions": [...]}
 *
 *   event: error
 *   data: {"type": "error", "message": "AI 서비스 오류"}
 */

export type ChatStreamEventType = 'token' | 'done' | 'error';

export interface ChatStreamTokenEvent {
  type: 'token';
  content: string;             // 스트리밍 토큰 조각
}

export interface ChatStreamDoneEvent {
  type: 'done';
  conversationId: string;
  suggestions?: string[];
}

export interface ChatStreamErrorEvent {
  type: 'error';
  message: string;
}

export type ChatStreamEvent =
  | ChatStreamTokenEvent
  | ChatStreamDoneEvent
  | ChatStreamErrorEvent;
```

### 11.5 Chat History (DB 저장 형태)

```typescript
// @wigtn/shared/types/ai.ts (추가)

/** DB에 저장된 채팅 메시지 (히스토리 조회 응답용) */
export interface ChatHistoryMessage extends BaseEntity {
  userId: string;
  tripId?: string;
  role: ChatRole;
  content: string;
}

/** 채팅 히스토리 필터 */
export interface ChatHistoryParams extends PaginationParams {
  tripId?: string;
}
```

---

## 12. API Endpoint 보완 (Digging 결과 반영)

### 12.1 Auth (보완)

| Method | Endpoint | Request DTO | Response DTO | 비고 |
|--------|----------|-------------|--------------|------|
| POST | `/auth/register` | `RegisterDto` | `ApiResponse<AuthResponse>` | |
| POST | `/auth/login` | `LoginDto` | `ApiResponse<AuthResponse>` | |
| POST | `/auth/social` | `SocialLoginDto` | `ApiResponse<AuthResponse>` | |
| POST | `/auth/refresh` | `RefreshTokenDto` | `ApiResponse<AuthTokens>` | |
| POST | `/auth/logout` | `RefreshTokenDto` | `ApiResponse<{ message }>` | |
| GET | `/auth/me` | - | `ApiResponse<User>` | |
| POST | `/auth/forgot-password` | `ForgotPasswordDto` | `ApiResponse<{ message }>` | NEW |
| POST | `/auth/reset-password` | `ResetPasswordDto` | `ApiResponse<{ message }>` | NEW |

### 12.2 Upload (신규)

| Method | Endpoint | Request DTO | Response DTO |
|--------|----------|-------------|--------------|
| POST | `/upload/presigned-url` | `RequestUploadUrlDto` | `ApiResponse<UploadUrlResponse>` |

### 12.3 AI (보완)

| Method | Endpoint | Request DTO | Response DTO | 비고 |
|--------|----------|-------------|--------------|------|
| POST | `/ai/receipt/analyze` | `AnalyzeReceiptRequestDto` | `ApiResponse<AnalyzeReceiptResponseDto>` | |
| POST | `/ai/receipt/analyze/batch` | `BatchAnalyzeReceiptRequestDto` | `ApiResponse<BatchAnalyzeReceiptResponseDto>` | NEW |
| POST | `/ai/chat` | `ChatRequestDto` | `ApiResponse<ChatResponseDto>` | 동기 |
| POST | `/ai/chat/stream` | `ChatRequestDto` | SSE `ChatStreamEvent` | NEW (스트리밍) |
| GET | `/ai/chat/history` | `ChatHistoryParams` | `ApiResponse<PaginatedResponse<ChatHistoryMessage>>` | 페이지네이션 적용 |

### 12.4 Sync (신규)

| Method | Endpoint | Request DTO | Response DTO |
|--------|----------|-------------|--------------|
| POST | `/sync/push` | `SyncPushDto` | `ApiResponse<SyncPushResponse>` |
| POST | `/sync/resolve` | `SyncResolveConflictDto` | `ApiResponse<{ message }>` |
| POST | `/sync/migrate` | `MigrationUploadDto` | `ApiResponse<MigrationUploadResponse>` |
| GET | `/sync/pull` | `{ lastSyncedAt: string }` | `ApiResponse<SyncPushResponse>` |

---

## 13. Implementation Checklist (구현 순서)

> `/implement` 실행 시 아래 체크리스트를 todo_plan으로 변환하여 사용한다.
> 각 Phase 내에서 레이어별 순서: **Schema → DB → Backend → Frontend**

### Phase 0: 기반 작업 (Schema 통합)

```
□ @wigtn/shared 타입을 이 문서 기준으로 업데이트
  □ types/common.ts (BaseEntity, Pagination)
  □ types/user.ts (User, Auth DTOs, ForgotPassword, ResetPassword)
  □ types/trip.ts (Trip, Destination + countryCode 추가)
  □ types/expense.ts (Expense, DTOs, FilterParams, Stats)
  □ types/exchange-rate.ts (ExchangeRates, ConvertCurrency)
  □ types/ai.ts (Receipt, Chat, Batch, Stream, ChatHistory)
  □ types/sync.ts (Sync DTOs - 신규)
  □ types/upload.ts (이미지 업로드 - 신규)
  □ types/api.ts (ApiResponse, ErrorCode)
  □ constants.ts (Categories, Currencies, Validation, Countries)
  □ index.ts (re-export)
□ pnpm build --filter=@wigtn/shared 빌드 확인
```

### Phase 1: 인증 + 기본 API

```
□ DB: Prisma schema 업데이트
  □ Destination에 countryCode 컬럼 추가
  □ PaymentMethod에서 'wallet' 제거 (enum 축소)
  □ deletedAt 컬럼 추가 (soft delete)
  □ prisma migrate dev 실행
□ Backend: Auth Module
  □ RegisterDto (class-validator, implements IRegisterDto)
  □ LoginDto
  □ JWT 전략 (Access 15분, Refresh 7일)
  □ 소셜 로그인 (Apple, Google)
  □ 비밀번호 재설정 (forgot/reset)
  □ /auth/me 엔드포인트
□ Backend: Trip Module
  □ CRUD 엔드포인트 (/trips, /trips/:id)
  □ Destination CRUD (/trips/:tripId/destinations)
□ Backend: Expense Module
  □ CRUD 엔드포인트 (/trips/:tripId/expenses)
  □ 통계 엔드포인트 (/trips/:tripId/expenses/stats)
  □ 필터/검색/페이지네이션
□ Backend: Exchange Rate Module
  □ 환율 조회/변환 API
  □ 일별 캐싱
□ Backend: Upload Module
  □ presigned URL 생성 API
□ Frontend: 인증 연동
  □ 로그인/회원가입 화면
  □ 소셜 로그인 연동
  □ 토큰 저장 (SecureStore)
  □ API 클라이언트 (interceptor, 자동 토큰 갱신)
□ Frontend: 기존 types.ts → @wigtn/shared 마이그레이션
  □ 필드명 변경 (date→expenseDate 등)
  □ SQLite 스키마 마이그레이션
  □ Zustand store 타입 업데이트
```

### Phase 2: 동기화 + 오프라인

```
□ Backend: Sync Module
  □ /sync/push 엔드포인트
  □ /sync/pull 엔드포인트
  □ /sync/resolve 충돌 해결
  □ /sync/migrate 초기 마이그레이션
□ Frontend: 동기화
  □ 오프라인 큐 (미동기화 변경사항 저장)
  □ 온라인 복귀 시 자동 push
  □ 충돌 해결 UI
  □ 마이그레이션 프롬프트 UI
```

### Phase 3: AI 영수증 OCR

```
□ AI-Engine: Receipt 분석 API
  □ Pydantic 모델 업데이트 (Data Schema 기준)
  □ POST /analyze 엔드포인트
  □ VLM 추론 서비스
□ Backend: AI Proxy
  □ POST /ai/receipt/analyze
  □ POST /ai/receipt/analyze/batch
  □ 영수증 이미지 → presigned URL 저장 연동
  □ ReceiptAnalysis → suggestedExpense 변환 로직
□ Frontend: OCR UI
  □ 카메라/갤러리 이미지 선택
  □ 분석 결과 확인/수정 화면
  □ 배치 처리 UI
```

### Phase 4: AI 챗봇

```
□ AI-Engine: Chat API
  □ POST /chat 동기 엔드포인트
  □ POST /chat/stream SSE 엔드포인트
□ Backend: Chat Proxy
  □ POST /ai/chat (동기)
  □ POST /ai/chat/stream (SSE 스트리밍)
  □ GET /ai/chat/history (페이지네이션)
  □ 컨텍스트 구성 로직 (여행/지출 데이터 요약)
  □ 대화 히스토리 DB 저장
□ Frontend: 챗봇 UI
  □ 채팅 화면
  □ 스트리밍 응답 렌더링
  □ 추천 질문 버튼
  □ 대화 히스토리 로드
```

### Phase 5: 배포 + 최적화

```
□ DevOps: CI/CD
  □ GitHub Actions 파이프라인
  □ Docker 컨테이너화
  □ 프로덕션 배포
□ 모니터링
  □ 에러 추적 (Sentry)
  □ API 성능 모니터링
  □ AI 사용량/비용 추적
```

---

## 14. 지원 국가 목록

```typescript
// @wigtn/shared/constants.ts (추가)

export interface CountryInfo {
  code: string;               // ISO 3166-1 alpha-2
  name: string;               // 한국어 표시명
  currency: SupportedCurrency;
  flag: string;               // emoji flag
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: 'JP', name: '일본', currency: 'JPY', flag: '🇯🇵' },
  { code: 'US', name: '미국', currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name: '영국', currency: 'GBP', flag: '🇬🇧' },
  { code: 'FR', name: '프랑스', currency: 'EUR', flag: '🇫🇷' },
  { code: 'DE', name: '독일', currency: 'EUR', flag: '🇩🇪' },
  { code: 'IT', name: '이탈리아', currency: 'EUR', flag: '🇮🇹' },
  { code: 'ES', name: '스페인', currency: 'EUR', flag: '🇪🇸' },
  { code: 'NL', name: '네덜란드', currency: 'EUR', flag: '🇳🇱' },
  { code: 'TH', name: '태국', currency: 'THB', flag: '🇹🇭' },
  { code: 'VN', name: '베트남', currency: 'VND', flag: '🇻🇳' },
  { code: 'TW', name: '대만', currency: 'TWD', flag: '🇹🇼' },
  { code: 'CN', name: '중국', currency: 'CNY', flag: '🇨🇳' },
  { code: 'PH', name: '필리핀', currency: 'PHP', flag: '🇵🇭' },
  { code: 'SG', name: '싱가포르', currency: 'SGD', flag: '🇸🇬' },
  { code: 'AU', name: '호주', currency: 'AUD', flag: '🇦🇺' },
  { code: 'CA', name: '캐나다', currency: 'CAD', flag: '🇨🇦' },
  { code: 'CH', name: '스위스', currency: 'CHF', flag: '🇨🇭' },
  { code: 'CZ', name: '체코', currency: 'CZK', flag: '🇨🇿' },
  { code: 'HK', name: '홍콩', currency: 'HKD', flag: '🇭🇰' },
  { code: 'MY', name: '말레이시아', currency: 'MYR', flag: '🇲🇾' },
  { code: 'NZ', name: '뉴질랜드', currency: 'NZD', flag: '🇳🇿' },
  { code: 'ID', name: '인도네시아', currency: 'IDR', flag: '🇮🇩' },
];
```

---

## 15. 용어집 (Glossary)

| 한국어 | 영어 | 설명 |
|--------|------|------|
| 여행 | Trip | 하나의 여행 일정 단위 |
| 방문지 | Destination | 여행 내 개별 국가/도시 |
| 지출 | Expense | 단일 소비 기록 |
| 통화 | Currency | ISO 4217 통화 코드 |
| 환율 | Exchange Rate | 1 외화 = X KRW |
| 영수증 | Receipt | OCR 분석 대상 이미지 |
| 동기화 | Sync | 오프라인 ↔ 온라인 데이터 맞춤 |
| 충돌 | Conflict | 같은 데이터가 양쪽에서 수정됨 |
| SSOT | Single Source of Truth | 데이터 정의의 유일한 기준 |
