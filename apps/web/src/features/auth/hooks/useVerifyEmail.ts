import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/features/auth/api';

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
  });
};
