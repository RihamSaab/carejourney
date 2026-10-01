import { useQuery } from '@tanstack/react-query';

import { profileApi } from '@/features/profile/api';
import type { PatientProfile } from '@/features/profile/types';

export const profileQueryKey = ['profile', 'me'] as const;

export const useProfile = () => {
  return useQuery<PatientProfile>({
    queryKey: profileQueryKey,
    queryFn: () => profileApi.getMe(),
  });
};
