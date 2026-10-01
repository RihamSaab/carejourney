import { useQuery } from '@tanstack/react-query';

import { appointmentsApi } from '@/features/appointments/api';
import type { Appointment } from '@/features/appointments/types';

export const carePlanAppointmentsQueryKey = (carePlanId: string) =>
  ['appointments', 'care-plan', carePlanId] as const;

export const useCarePlanAppointments = (carePlanId: string | undefined) => {
  return useQuery<Appointment[]>({
    queryKey: carePlanAppointmentsQueryKey(carePlanId ?? ''),
    queryFn: () => {
      if (!carePlanId) throw new Error('care plan id is required');
      return appointmentsApi.listForCarePlan(carePlanId);
    },
    enabled: Boolean(carePlanId),
  });
};
