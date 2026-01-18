import { Category } from './utils/constants';

// 여행
export interface Trip {
  id: string;
  name: string;
  country: string;
  currency: string;
  startDate: string;
  endDate: string;
  budget?: number;
  createdAt: string;
}

// 지출
export interface Expense {
  id: string;
  tripId: string;
  amount: number;
  currency: string;
  amountKRW: number;
  exchangeRate: number;
  category: Category;
  memo?: string;
  date: string;
  createdAt: string;
}

// 환율 캐시
export interface ExchangeRateCache {
  rates: Record<string, number>;
  lastUpdated: string;
}

// 통계
export interface ExpenseStats {
  totalKRW: number;
  totalLocal: number;
  byCategory: Record<Category, number>;
  byDate: Record<string, number>;
}
