import { useMutation, useQueryClient } from '@tanstack/react-query';

import { medicationsApi } from '@/features/medications/api';
import { carePlanMedicationsQueryKey } from '@/features/medications/hooks/useCarePlanMedications';
import type { CreateMedicationInput, Medication } from '@/features/medications/types';
import { ApiError } from '@/shared/api';
import { toast } from '@/shared/components/toaster';

type Variables = {
  carePlanId: string;
  input: CreateMedicationInput;
};

export const useCreateMedication = () => {
  const queryClient = useQueryClient();

  return useMutation<Medication, Error, Variables>({
    mutationFn: ({ carePlanId, input }) => medicationsApi.createForCarePlan(carePlanId, input),
    onSuccess: (_medication, variables) => {
      toast.success('Medication added');
      void queryClient.invalidateQueries({
        queryKey: carePlanMedicationsQueryKey(variables.carePlanId),
      });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.detail : 'Could not add the medication.';
      toast.error(message);
    },
  });
};
