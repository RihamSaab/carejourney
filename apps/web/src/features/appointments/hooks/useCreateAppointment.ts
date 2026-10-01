import { useMutation, useQueryClient } from '@tanstack/react-query';

import { appointmentsApi } from '@/features/appointments/api';
import { carePlanAppointmentsQueryKey } from '@/features/appointments/hooks/useCarePlanAppointments';
import { upcomingAppointmentsQueryKey } from '@/features/appointments/hooks/useUpcomingAppointments';
import type { Appointment, CreateAppointmentInput } from '@/features/appointments/types';
import { ApiError } from '@/shared/api';
import { toast } from '@/shared/components/toaster';

type Variables = {
  carePlanId: string;
  input: CreateAppointmentInput;
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation<Appointment, Error, Variables>({
    mutationFn: ({ carePlanId, input }) => appointmentsApi.create(carePlanId, input),
    onSuccess: (_appt, variables) => {
      toast.success('Appointment created');
      void queryClient.invalidateQueries({
        queryKey: carePlanAppointmentsQueryKey(variables.carePlanId),
      });
      void queryClient.invalidateQueries({ queryKey: upcomingAppointmentsQueryKey });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.detail : 'Could not create the appointment.';
      toast.error(message);
    },
  });
};
