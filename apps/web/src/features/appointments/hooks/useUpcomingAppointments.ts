import { useQuery } from '@tanstack/react-query';

import { appointmentsApi } from '@/features/appointments/api';
import type { Appointment } from '@/features/appointments/types';

export const upcomingAppointmentsQueryKey = ['appointments', 'upcoming'] as const;

export const useUpcomingAppointments = () => {
  return useQuery<Appointment[]>({
    queryKey: upcomingAppointmentsQueryKey,
    queryFn: () => appointmentsApi.listUpcomingForPatient(),
  });
};
