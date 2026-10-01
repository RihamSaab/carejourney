import { useQuery } from '@tanstack/react-query';

import { carePlanApi } from '@/features/care-plan/api';
import type { CarePlan } from '@/features/care-plan/types';

export const carePlansQueryKey = ['care-plans', 'mine'] as const;

export const useMyCarePlans = () => {
  return useQuery<CarePlan[]>({
    queryKey: carePlansQueryKey,
    queryFn: () => carePlanApi.listMine(),
  });
};
