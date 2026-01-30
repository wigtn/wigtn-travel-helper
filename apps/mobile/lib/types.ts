// Travel Helper v1.1 - Type Definitions (Simplified)
// PRD v1.1 기준 - 지갑/환전 기능 제외

import { Category } from './utils/constants';

// 여행
export interface Trip {
  id: string;
  name: string;
  startDate: string;        // YYYY-MM-DD
  endDate: string;
  budget?: number;          // 총 예산 (KRW)
  createdAt: string;
}

// 방문지 (여행 내 국가별 기간)
export interface Destination {
  id: string;
  tripId: string;
  country: string;          // "일본"
  countryName?: string;     // "Japan" (영어명)
  city?: string;            // "도쿄"
  currency: string;         // "JPY"
  startDate?: string;       // 해당 지역 방문 시작
  endDate?: string;         // 해당 지역 방문 종료
  orderIndex: number;       // 방문 순서
  latitude?: number;        // 위도 (지도 핀용)
  longitude?: number;       // 경도 (지도 핀용)
  createdAt: string;
}

// 여행 상태 (PRD main-screen-revamp)
export type TripStatus = 'upcoming' | 'active' | 'past';

// 여행 + 상태 헬퍼
export function getTripStatus(trip: Trip): TripStatus {
  const today = new Date().toISOString().split('T')[0];
  if (today < trip.startDate) return 'upcoming';
  if (today > trip.endDate) return 'past';
  return 'active';
}

// 지출
export interface Expense {
  id: string;
  tripId: string;
  destinationId?: string;   // 어느 방문지(국가)에서 썼는지
  amount: number;           // 현지 통화 금액
  currency: string;         // "JPY"
  amountKRW: number;        // 원화 환산 (저장 시점 환율)
  exchangeRate: number;     // 적용된 환율
  category: Category;
  memo?: string;
  date: string;             // YYYY-MM-DD
  time?: string;            // HH:MM
  receiptId?: string;       // 영수증 분석 결과 ID
  inputMethod?: ExpenseInputMethod; // 입력 방식 (receipt | manual)
  createdAt: string;
}

// 환율 캐시
export interface ExchangeRateCache {
  rates: Record<string, number>;  // { "JPY": 9.25, "USD": 1350 } - 1 외화 = X KRW
  lastUpdated: string;
}

// 통계
export interface ExpenseStats {
  totalKRW: number;
  totalLocal: Record<string, number>;  // 통화별 합계
  byCategory: Record<Category, number>;
  byDate: Record<string, number>;
  byDestination: Record<string, number>;
  byCurrency: Record<string, { amount: number; amountKRW: number }>;
}

// 현재 위치 정보 (날짜 기반 자동 감지)
export interface CurrentLocation {
  destination: Destination | null;
  dayIndex: number;  // 여행 몇일차
}

// 통화 표시 모드 (PRD FR-007)
export type CurrencyDisplayMode = 'local' | 'krw';

// 테마 모드
export type ThemeMode = 'system' | 'light' | 'dark';

// 날짜별 국가 그룹 지출 (PRD FR-008 다중 국가 레이어)
export interface DayExpenseGroup {
  date: string;
  destination: Destination;
  expenses: Expense[];
  totalLocal: number;
  totalKRW: number;
}

// 설정
export interface AppSettings {
  currencyDisplayMode: CurrencyDisplayMode;
  hapticEnabled: boolean;
  themeMode: ThemeMode;
}

// 영수증 이미지 (PRD receipt-expense-input)
export interface ReceiptImage {
  uri: string;
  width: number;
  height: number;
  type: 'camera' | 'gallery';
  mimeType?: string;
  fileSize?: number;
}

// 지출 입력 방식
export type ExpenseInputMethod = 'receipt' | 'manual';
export type ReceiptInputSource = 'camera' | 'gallery';

// 이미지 처리 결과 타입
export interface ImageCaptureResult {
  success: boolean;
  image?: ReceiptImage;
  error?: 'CAMERA_NOT_READY' | 'CAPTURE_FAILED' | 'PERMISSION_DENIED' | 'FILE_TOO_LARGE' | 'CANCELLED';
}

// 영수증 첨부 지출 (확장)
export interface ExpenseWithReceipt extends Omit<Expense, 'id' | 'createdAt'> {
  receiptImage?: ReceiptImage;
}
