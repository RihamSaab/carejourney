import { useMutation, useQueryClient } from '@tanstack/react-query';

import { carePlanApi } from '@/features/care-plan/api';
import { carePlansQueryKey } from '@/features/care-plan/hooks/useMyCarePlans';
import type { CarePlan, CreateCarePlanInput } from '@/features/care-plan/types';
import { ApiError } from '@/shared/api';
import { toast } from '@/shared/components/toaster';

export const useCreateCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation<CarePlan, Error, CreateCarePlanInput>({
    mutationFn: (input) => carePlanApi.create(input),
    onSuccess: () => {
      toast.success('Care plan created');
      void queryClient.invalidateQueries({ queryKey: carePlansQueryKey });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.detail : 'Could not create the care plan.';
      toast.error(message);
    },
  });
};
