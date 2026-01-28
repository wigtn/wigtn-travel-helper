// Travel Helper v1.1 - Settings Store
// PRD FR-007: 글로벌 통화 토글 상태 관리
// 테마 모드 지원 추가

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { CurrencyDisplayMode, ThemeMode, AppSettings } from '../types';

// SecureStore를 사용한 커스텀 스토리지 (설정 값 저장용)
const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

interface SettingsState extends AppSettings {
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
    (set) => ({
      currencyDisplayMode: 'local',
      hapticEnabled: true,
      themeMode: 'system',

      toggleCurrencyDisplayMode: () => {
        set((state) => ({
          currencyDisplayMode: state.currencyDisplayMode === 'local' ? 'krw' : 'local',
        }));
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
    }
  )
);
