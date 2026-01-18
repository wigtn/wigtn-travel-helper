import { CURRENCIES } from './constants';

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  if (!currency) return `${amount}`;

  // VND, JPY 등은 소수점 없이
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'TWD'];
  const maximumFractionDigits = noDecimalCurrencies.includes(currencyCode) ? 0 : 2;

  return `${currency.symbol}${new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(amount)}`;
}

export function convertToKRW(amount: number, exchangeRate: number): number {
  // exchangeRate는 1 KRW = X 외화 형태
  // 예: JPY 환율이 0.0925면 1 KRW = 0.0925 JPY
  // 따라서 JPY를 KRW로 변환하려면 amount / exchangeRate
  if (exchangeRate === 0) return 0;
  return Math.round(amount / exchangeRate);
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}

export function getCurrencyFlag(currencyCode: string): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  return currency?.flag || '🌍';
}
