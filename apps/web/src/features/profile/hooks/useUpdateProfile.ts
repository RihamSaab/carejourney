import { useMutation, useQueryClient } from '@tanstack/react-query';

import { profileApi } from '@/features/profile/api';
import { profileQueryKey } from '@/features/profile/hooks/useProfile';
import type { PatientProfile, UpdatePatientProfileInput } from '@/features/profile/types';
import { ApiError } from '@/shared/api';
import { toast } from '@/shared/components/toaster';

type MutationContext = {
  previous: PatientProfile | undefined;
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<PatientProfile, Error, UpdatePatientProfileInput, MutationContext>({
    mutationFn: (input) => profileApi.update(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: profileQueryKey });
      const previous = queryClient.getQueryData<PatientProfile>(profileQueryKey);
      if (previous) {
        queryClient.setQueryData<PatientProfile>(profileQueryKey, { ...previous, ...input });
      }
      return { previous };
    },

    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(profileQueryKey, context.previous);
      }
      const message = error instanceof ApiError ? error.detail : 'Could not save your profile.';
      toast.error(message);
    },

    onSuccess: () => {
      toast.success('Profile updated');
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });
};
