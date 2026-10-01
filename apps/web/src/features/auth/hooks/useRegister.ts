import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/features/auth/api';
import type { RegisterInput } from '@/features/auth/types';

export const useRegister = () => {
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
  });
};
