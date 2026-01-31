// Travel Helper v3.0 - Sync Store (Network status only)
// 오프라인 동기화 기능 제거 - 서버 전용 모드

import { create } from 'zustand';
import { networkService } from '../services/networkService';

export type SyncStatus = 'online' | 'offline';

interface SyncState {
  status: SyncStatus;
  isOnline: boolean;

  // Actions
  initialize: () => void;
  checkConnection: () => Promise<boolean>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'online',
  isOnline: true,

  initialize: () => {
    const isConnected = networkService.getIsConnected();
    set({
      status: isConnected ? 'online' : 'offline',
      isOnline: isConnected,
    });

    // Subscribe to network changes
    networkService.subscribe((isConnected) => {
      set({
        status: isConnected ? 'online' : 'offline',
        isOnline: isConnected,
      });
    });
  },

  checkConnection: async () => {
    const isConnected = await networkService.checkConnection();
    set({
      status: isConnected ? 'online' : 'offline',
      isOnline: isConnected,
    });
    return isConnected;
  },
}));
