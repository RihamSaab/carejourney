import { useMutation, useQueryClient } from '@tanstack/react-query';

import { appointmentsApi } from '@/features/appointments/api';
import { upcomingAppointmentsQueryKey } from '@/features/appointments/hooks/useUpcomingAppointments';
import type { Appointment, UpdateAppointmentInput } from '@/features/appointments/types';
import { ApiError } from '@/shared/api';
import { toast } from '@/shared/components/toaster';

type Variables = {
  appointmentId: string;
  input: UpdateAppointmentInput;
};

type Context = {
  previousUpcoming: Appointment[] | undefined;
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation<Appointment, Error, Variables, Context>({
    mutationFn: ({ appointmentId, input }) => appointmentsApi.update(appointmentId, input),

    onMutate: async ({ appointmentId, input }) => {
      await queryClient.cancelQueries({ queryKey: upcomingAppointmentsQueryKey });
      const previousUpcoming = queryClient.getQueryData<Appointment[]>(
        upcomingAppointmentsQueryKey,
      );
      if (previousUpcoming) {
        queryClient.setQueryData<Appointment[]>(
          upcomingAppointmentsQueryKey,
          previousUpcoming.map((appt) =>
            appt.id === appointmentId
              ? {
                  ...appt,
                  ...input,
                  description:
                    input.description === undefined ? appt.description : input.description,
                  location_detail:
                    input.location_detail === undefined
                      ? appt.location_detail
                      : input.location_detail,
                }
              : appt,
          ),
        );
      }
      return { previousUpcoming };
    },

    onError: (error, _variables, context) => {
      if (context?.previousUpcoming) {
        queryClient.setQueryData(upcomingAppointmentsQueryKey, context.previousUpcoming);
      }
      const message =
        error instanceof ApiError ? error.detail : 'Could not update the appointment.';
      toast.error(message);
    },

    onSuccess: (appt) => {
      queryClient.setQueryData(upcomingAppointmentsQueryKey, (prev: Appointment[] | undefined) =>
        prev ? prev.map((a) => (a.id === appt.id ? appt : a)) : prev,
      );
      void queryClient.invalidateQueries({
        queryKey: ['appointments', 'care-plan', appt.care_plan_id],
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: upcomingAppointmentsQueryKey });
    },
  });
};
