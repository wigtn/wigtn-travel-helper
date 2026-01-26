// @wigtn/shared - Expense Types
// Data Schema Contract SSOT

import { BaseEntity, PaginationParams } from './common';

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
