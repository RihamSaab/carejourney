import { useEffect } from 'react';

import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { ApiError, configureApiAuth } from '@/shared/api';

export const useAuthBootstrap = () => {
  useEffect(() => {
    configureApiAuth({
      getAccessToken: () => useAuthStore.getState().accessToken,
      refreshAccessToken: async () => {
        const currentRefresh = useAuthStore.getState().refreshToken;
        if (!currentRefresh) return null;
        try {
          const result = await authApi.refresh(currentRefresh);
          useAuthStore.getState().setAuth(result.user, result.tokens);
          return result.tokens.access_token;
        } catch {
          useAuthStore.getState().clearAuth();
          return null;
        }
      },
      onAuthFailure: () => {
        useAuthStore.getState().clearAuth();
      },
    });

    const hydrate = async () => {
      const storedRefresh = useAuthStore.getState().refreshToken;
      if (!storedRefresh) {
        useAuthStore.getState().setHydrating(false);
        return;
      }
      try {
        const result = await authApi.refresh(storedRefresh);
        useAuthStore.getState().setAuth(result.user, result.tokens);
      } catch (error) {
        if (!(error instanceof ApiError)) {
          console.error('Unexpected error during auth hydration', error);
        }
        useAuthStore.getState().clearAuth();
      }
    };

    void hydrate();
  }, []);
};
