import { create } from 'zustand';

import type { AuthTokens, User } from '@/features/auth/types';

import { authStorage } from './authStorage';

type AuthState = {
  currentUser: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrating: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  clearAuth: () => void;
  setHydrating: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  accessToken: null,
  refreshToken: authStorage.getRefreshToken(),
  isHydrating: true,

  setAuth: (user, tokens) => {
    authStorage.setRefreshToken(tokens.refresh_token);
    set({
      currentUser: user,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      isHydrating: false,
    });
  },

  setAccessToken: (token) => {
    set({ accessToken: token });
  },

  setRefreshToken: (token) => {
    authStorage.setRefreshToken(token);
    set({ refreshToken: token });
  },

  clearAuth: () => {
    authStorage.clearRefreshToken();
    set({
      currentUser: null,
      accessToken: null,
      refreshToken: null,
      isHydrating: false,
    });
  },

  setHydrating: (value) => {
    set({ isHydrating: value });
  },
}));
