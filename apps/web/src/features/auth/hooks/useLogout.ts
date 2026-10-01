import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export const useLogout = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => undefined);
      }
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
};
