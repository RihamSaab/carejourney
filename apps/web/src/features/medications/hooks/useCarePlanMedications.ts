import { useQuery } from '@tanstack/react-query';

import { medicationsApi } from '@/features/medications/api';
import type { Medication } from '@/features/medications/types';

export const carePlanMedicationsQueryKey = (carePlanId: string) =>
  ['medications', 'care-plan', carePlanId] as const;

export const useCarePlanMedications = (carePlanId: string | undefined) => {
  return useQuery<Medication[]>({
    queryKey: carePlanMedicationsQueryKey(carePlanId ?? ''),
    queryFn: () => {
      if (!carePlanId) throw new Error('care plan id is required');
      return medicationsApi.listForCarePlan(carePlanId);
    },
    enabled: Boolean(carePlanId),
  });
};
