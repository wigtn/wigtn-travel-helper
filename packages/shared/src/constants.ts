// @wigtn/shared - Constants
// Data Schema Contract SSOT

import { SupportedCurrency } from './types/exchange-rate';
import { Category, PaymentMethod } from './types/expense';
import { TripStatus } from './types/trip';

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

// ─── Supported Countries ───

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
