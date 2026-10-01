import { useMutation, useQueryClient } from '@tanstack/react-query';

import { medicationsApi } from '@/features/medications/api';
import { todayMedicationEventsQueryKey } from '@/features/medications/hooks/useTodayMedicationEvents';
import type { MedicationEvent, UpdateMedicationEventInput } from '@/features/medications/types';
import { ApiError } from '@/shared/api';
import { toast } from '@/shared/components/toaster';

type Variables = {
  eventId: string;
  input: UpdateMedicationEventInput;
};

type Context = {
  previous: MedicationEvent[] | undefined;
};

export const useUpdateMedicationEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<MedicationEvent, Error, Variables, Context>({
    mutationFn: ({ eventId, input }) => medicationsApi.updateEvent(eventId, input),

    onMutate: async ({ eventId, input }) => {
      await queryClient.cancelQueries({ queryKey: todayMedicationEventsQueryKey });
      const previous = queryClient.getQueryData<MedicationEvent[]>(todayMedicationEventsQueryKey);
      if (previous) {
        queryClient.setQueryData<MedicationEvent[]>(
          todayMedicationEventsQueryKey,
          previous.map((event) =>
            event.id === eventId
              ? { ...event, state: input.state, acted_at: new Date().toISOString() }
              : event,
          ),
        );
      }
      return { previous };
    },

    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(todayMedicationEventsQueryKey, context.previous);
      }
      const message = error instanceof ApiError ? error.detail : 'Could not update the dose.';
      toast.error(message);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: todayMedicationEventsQueryKey });
    },
  });
};
