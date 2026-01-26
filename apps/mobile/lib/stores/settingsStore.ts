// Travel Helper v1.1 - Settings Store
// PRD FR-007: 글로벌 통화 토글 상태 관리
// Note: 설정은 앱 세션 내에서만 유지 (persist 제거됨)

import { create } from 'zustand';
import { CurrencyDisplayMode, AppSettings } from '../types';

interface SettingsState extends AppSettings {
  // 통화 표시 모드 토글 (FR-007)
  toggleCurrencyDisplayMode: () => void;
  setCurrencyDisplayMode: (mode: CurrencyDisplayMode) => void;

  // 햅틱 피드백
  setHapticEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  currencyDisplayMode: 'local',
  hapticEnabled: true,

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
}));
