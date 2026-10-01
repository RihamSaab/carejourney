import { useQuery } from '@tanstack/react-query';

import { tasksApi } from '@/features/tasks/api';
import type { Task } from '@/features/tasks/types';

export const carePlanTasksQueryKey = (carePlanId: string) =>
  ['tasks', 'care-plan', carePlanId] as const;

export const useCarePlanTasks = (carePlanId: string | undefined) => {
  return useQuery<Task[]>({
    queryKey: carePlanTasksQueryKey(carePlanId ?? ''),
    queryFn: () => {
      if (!carePlanId) throw new Error('care plan id is required');
      return tasksApi.listForCarePlan(carePlanId);
    },
    enabled: Boolean(carePlanId),
  });
};
