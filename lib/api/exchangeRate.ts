import { getExchangeRates, saveExchangeRates } from '../db/queries';
import { ExchangeRateCache } from '../types';

// ExchangeRate-API 무료 플랜 사용
// 실제 사용 시 API 키를 환경변수로 관리해야 합니다
const API_BASE_URL = 'https://open.er-api.com/v6/latest/KRW';

// 캐시 만료 시간: 24시간
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

// 기본 환율 (오프라인 또는 API 실패 시 사용)
const DEFAULT_RATES: Record<string, number> = {
  JPY: 0.1065,
  USD: 0.00071,
  EUR: 0.00065,
  THB: 0.025,
  VND: 17.8,
  TWD: 0.023,
  CNY: 0.0051,
  GBP: 0.00056,
  AUD: 0.0011,
  SGD: 0.00095,
};

export async function fetchExchangeRates(): Promise<ExchangeRateCache> {
  // 먼저 캐시 확인
  const cached = await getExchangeRates();
  if (cached && !isCacheExpired(cached.lastUpdated)) {
    return cached;
  }

  // API 호출
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    if (data.result !== 'success') {
      throw new Error('API returned error');
    }

    const newCache: ExchangeRateCache = {
      rates: data.rates,
      lastUpdated: new Date().toISOString(),
    };

    // 캐시에 저장
    await saveExchangeRates(newCache);
    return newCache;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);

    // 캐시된 값이 있으면 만료되어도 사용
    if (cached) {
      return cached;
    }

    // 기본 환율 반환
    return {
      rates: DEFAULT_RATES,
      lastUpdated: new Date().toISOString(),
    };
  }
}

function isCacheExpired(lastUpdated: string): boolean {
  const cacheTime = new Date(lastUpdated).getTime();
  const now = Date.now();
  return now - cacheTime > CACHE_EXPIRY_MS;
}

export function getExchangeRate(rates: Record<string, number>, currencyCode: string): number {
  return rates[currencyCode] ?? DEFAULT_RATES[currencyCode] ?? 1;
}
