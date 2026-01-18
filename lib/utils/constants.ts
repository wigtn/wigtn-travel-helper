// 카테고리 정의
export type Category = 'food' | 'transport' | 'shopping' | 'lodging' | 'activity' | 'etc';

export const CATEGORIES: { id: Category; label: string; icon: string; color: string }[] = [
  { id: 'food', label: '식비', icon: 'restaurant', color: '#FF6B6B' },
  { id: 'transport', label: '교통', icon: 'directions-bus', color: '#4ECDC4' },
  { id: 'shopping', label: '쇼핑', icon: 'shopping-bag', color: '#45B7D1' },
  { id: 'lodging', label: '숙박', icon: 'hotel', color: '#96CEB4' },
  { id: 'activity', label: '관광', icon: 'attractions', color: '#FFEAA7' },
  { id: 'etc', label: '기타', icon: 'more-horiz', color: '#DDA0DD' },
];

// 지원 통화
export const CURRENCIES: { code: string; symbol: string; name: string; flag: string }[] = [
  { code: 'JPY', symbol: '¥', name: '일본 엔', flag: '🇯🇵' },
  { code: 'USD', symbol: '$', name: '미국 달러', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: '유로', flag: '🇪🇺' },
  { code: 'THB', symbol: '฿', name: '태국 바트', flag: '🇹🇭' },
  { code: 'VND', symbol: '₫', name: '베트남 동', flag: '🇻🇳' },
  { code: 'TWD', symbol: 'NT$', name: '대만 달러', flag: '🇹🇼' },
  { code: 'CNY', symbol: '¥', name: '중국 위안', flag: '🇨🇳' },
  { code: 'GBP', symbol: '£', name: '영국 파운드', flag: '🇬🇧' },
  { code: 'AUD', symbol: 'A$', name: '호주 달러', flag: '🇦🇺' },
  { code: 'SGD', symbol: 'S$', name: '싱가포르 달러', flag: '🇸🇬' },
];

// 테마 색상
export const COLORS = {
  light: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    primary: '#007AFF',
    secondary: '#5856D6',
    text: '#1C1C1E',
    textSecondary: '#8E8E93',
    border: '#E5E5EA',
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500',
  },
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    success: '#30D158',
    error: '#FF453A',
    warning: '#FF9F0A',
  },
};
