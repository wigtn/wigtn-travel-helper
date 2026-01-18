import { create } from 'zustand';
import { ExchangeRateCache } from '../types';
import { fetchExchangeRates, getExchangeRate } from '../api/exchangeRate';
import { convertToKRW } from '../utils/currency';

interface ExchangeRateState {
  rates: Record<string, number>;
  lastUpdated: string | null;
  isLoading: boolean;
  loadRates: () => Promise<void>;
  getRate: (currencyCode: string) => number;
  convert: (amount: number, currencyCode: string) => number;
}

export const useExchangeRateStore = create<ExchangeRateState>((set, get) => ({
  rates: {},
  lastUpdated: null,
  isLoading: false,

  loadRates: async () => {
    set({ isLoading: true });
    try {
      const cache = await fetchExchangeRates();
      set({
        rates: cache.rates,
        lastUpdated: cache.lastUpdated,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
      set({ isLoading: false });
    }
  },

  getRate: (currencyCode) => {
    return getExchangeRate(get().rates, currencyCode);
  },

  convert: (amount, currencyCode) => {
    const rate = get().getRate(currencyCode);
    return convertToKRW(amount, rate);
  },
}));
