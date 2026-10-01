import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/features/auth/api';
import type { ResetPasswordInput } from '@/features/auth/types';

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => authApi.resetPassword(input),
  });
};
