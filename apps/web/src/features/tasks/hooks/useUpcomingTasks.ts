import { useQuery } from '@tanstack/react-query';

import { tasksApi } from '@/features/tasks/api';
import type { Task } from '@/features/tasks/types';

export const upcomingTasksQueryKey = ['tasks', 'upcoming'] as const;

export const useUpcomingTasks = () => {
  return useQuery<Task[]>({
    queryKey: upcomingTasksQueryKey,
    queryFn: () => tasksApi.listUpcomingForPatient(),
  });
};
