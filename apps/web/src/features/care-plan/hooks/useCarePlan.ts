import { useQuery } from '@tanstack/react-query';

import { carePlanApi } from '@/features/care-plan/api';
import type { CarePlan } from '@/features/care-plan/types';

export const carePlanQueryKey = (id: string) => ['care-plans', 'detail', id] as const;

export const useCarePlan = (id: string | undefined) => {
  return useQuery<CarePlan>({
    queryKey: carePlanQueryKey(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('care plan id is required');
      return carePlanApi.getById(id);
    },
    enabled: Boolean(id),
  });
};
