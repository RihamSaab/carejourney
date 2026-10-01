import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/features/auth/api';
import type { ForgotPasswordInput } from '@/features/auth/types';

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => authApi.forgotPassword(input),
  });
};
