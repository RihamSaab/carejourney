import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import type { LoginInput } from '@/features/auth/types';

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens);
    },
  });
};
