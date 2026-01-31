// Travel Helper v3.0 - Auth Store (Server-only)

import { create } from 'zustand';
import { authApi, User, AuthResponse } from '../api/auth';
import { tokenService } from '../services/tokenService';
import { onAuthExpired, getErrorMessage } from '../api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name?: string
  ) => Promise<void>;
  socialLogin: (
    provider: 'apple' | 'google',
    idToken: string,
    name?: string,
    email?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Handle successful auth
async function handleAuthSuccess(response: AuthResponse): Promise<User> {
  await tokenService.setTokens(response.tokens);
  await tokenService.setUser({
    id: response.user.id,
    email: response.user.email,
    name: response.user.name,
  });

  return response.user;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Subscribe to auth expiration events from API client
  onAuthExpired(() => {
    set({ user: null, isAuthenticated: false });
  });

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null,

    initialize: async () => {
      try {
        const token = await tokenService.getAccessToken();
        const isExpired = await tokenService.isTokenExpired();

        if (token && !isExpired) {
          // Try to get user info from stored data first
          const storedUser = await tokenService.getUser();
          if (storedUser) {
            set({
              user: {
                id: storedUser.id,
                email: storedUser.email,
                name: storedUser.name,
                createdAt: '',
                updatedAt: '',
              },
              isAuthenticated: true,
              isInitialized: true,
            });

            // Refresh user info in background
            try {
              const { data } = await authApi.me();
              set({ user: data.data });
            } catch {
              // Ignore background refresh errors
            }
            return;
          }

          // No stored user, try to fetch
          try {
            const { data } = await authApi.me();
            await tokenService.setUser({
              id: data.data.id,
              email: data.data.email,
              name: data.data.name,
            });
            set({
              user: data.data,
              isAuthenticated: true,
              isInitialized: true,
            });
            return;
          } catch {
            // Token invalid, clear it
            await tokenService.clearTokens();
          }
        } else if (token && isExpired) {
          // Try to refresh token
          try {
            const refreshToken = await tokenService.getRefreshToken();
            if (refreshToken) {
              const { data } = await authApi.refresh(refreshToken);
              await tokenService.setTokens(data);

              const storedUser = await tokenService.getUser();
              if (storedUser) {
                set({
                  user: {
                    id: storedUser.id,
                    email: storedUser.email,
                    name: storedUser.name,
                    createdAt: '',
                    updatedAt: '',
                  },
                  isAuthenticated: true,
                  isInitialized: true,
                });
                return;
              }
            }
          } catch {
            await tokenService.clearTokens();
          }
        }

        set({ isInitialized: true });
      } catch {
        await tokenService.clearTokens();
        set({ isInitialized: true });
      }
    },

    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const { data } = await authApi.login({ email, password });
        const user = await handleAuthSuccess(data);
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        const message = getErrorMessage(error);
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    register: async (email, password, name) => {
      set({ isLoading: true, error: null });
      try {
        const { data } = await authApi.register({ email, password, name });
        const user = await handleAuthSuccess(data);
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        const message = getErrorMessage(error);
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    socialLogin: async (provider, idToken, name, email) => {
      set({ isLoading: true, error: null });
      try {
        const { data } = await authApi.socialLogin({
          provider,
          idToken,
          name,
          email,
        });
        const user = await handleAuthSuccess(data);
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        const message = getErrorMessage(error);
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    logout: async () => {
      try {
        const refreshToken = await tokenService.getRefreshToken();
        if (refreshToken) {
          await authApi.logout(refreshToken).catch(() => {
            // Ignore logout API errors
          });
        }
      } finally {
        await tokenService.clearTokens();
        set({ user: null, isAuthenticated: false, error: null });
      }
    },

    clearError: () => set({ error: null }),
  };
});
