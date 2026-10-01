import { useMutation, useQueryClient } from '@tanstack/react-query';

import { carePlanApi } from '@/features/care-plan/api';
import { carePlanQueryKey } from '@/features/care-plan/hooks/useCarePlan';
import { carePlansQueryKey } from '@/features/care-plan/hooks/useMyCarePlans';
import type { CarePlan, UpdateCarePlanInput } from '@/features/care-plan/types';
import { ApiError } from '@/shared/api';
import { toast } from '@/shared/components/toaster';

type Variables = {
  id: string;
  input: UpdateCarePlanInput;
};

export const useUpdateCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation<CarePlan, Error, Variables>({
    mutationFn: ({ id, input }) => carePlanApi.update(id, input),
    onSuccess: (plan) => {
      toast.success('Care plan updated');
      queryClient.setQueryData(carePlanQueryKey(plan.id), plan);
      void queryClient.invalidateQueries({ queryKey: carePlansQueryKey });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.detail : 'Could not update the care plan.';
      toast.error(message);
    },
  });
};
