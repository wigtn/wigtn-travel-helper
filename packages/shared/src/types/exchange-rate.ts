// @wigtn/shared - Exchange Rate Types
// Data Schema Contract SSOT

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
