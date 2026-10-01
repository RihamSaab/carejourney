import { useQuery } from '@tanstack/react-query';

import { medicationsApi } from '@/features/medications/api';
import type { MedicationEvent } from '@/features/medications/types';

export const todayMedicationEventsQueryKey = ['medication-events', 'today'] as const;

export const useTodayMedicationEvents = () => {
  return useQuery<MedicationEvent[]>({
    queryKey: todayMedicationEventsQueryKey,
    queryFn: () => medicationsApi.listTodayForPatient(),
  });
};
