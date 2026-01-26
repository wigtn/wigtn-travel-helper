// @wigtn/shared - Trip Types
// Data Schema Contract SSOT

import { BaseEntity } from './common';
import { SupportedCurrency } from './exchange-rate';

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
