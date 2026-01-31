// Travel Helper v1.1 - Settings Store
// PRD FR-007: 글로벌 통화 토글 상태 관리
// 테마 모드 지원 추가

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { CurrencyDisplayMode, ThemeMode, AppSettings } from '../types';

// SecureStore를 사용한 커스텀 스토리지
const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await SecureStore.getItemAsync(name);
      return value;
    } catch (error) {
      console.warn('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.warn('SecureStore setItem error:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.warn('SecureStore removeItem error:', error);
    }
  },
};

interface SettingsState extends AppSettings {
  // Hydration 상태
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // 통화 표시 모드 토글 (FR-007)
  toggleCurrencyDisplayMode: () => void;
  setCurrencyDisplayMode: (mode: CurrencyDisplayMode) => void;

  // 햅틱 피드백
  setHapticEnabled: (enabled: boolean) => void;

  // 테마 모드
  setThemeMode: (mode: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      currencyDisplayMode: 'local',
      hapticEnabled: true,
      themeMode: 'system',
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      toggleCurrencyDisplayMode: () => {
        const currentMode = get().currencyDisplayMode;
        const newMode = currentMode === 'local' ? 'krw' : 'local';
        set({ currencyDisplayMode: newMode });
      },

      setCurrencyDisplayMode: (mode) => {
        set({ currencyDisplayMode: mode });
      },

      setHapticEnabled: (enabled) => {
        set({ hapticEnabled: enabled });
      },

      setThemeMode: (mode) => {
        set({ themeMode: mode });
      },
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Hydration 완료 여부 확인용 selector
export const useSettingsHydrated = () => useSettingsStore((state) => state._hasHydrated);
