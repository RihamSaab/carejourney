import { useMutation, useQueryClient } from '@tanstack/react-query';

import { tasksApi } from '@/features/tasks/api';
import { carePlanTasksQueryKey } from '@/features/tasks/hooks/useCarePlanTasks';
import { upcomingTasksQueryKey } from '@/features/tasks/hooks/useUpcomingTasks';
import type { CreateTaskInput, Task } from '@/features/tasks/types';
import { ApiError } from '@/shared/api';
import { toast } from '@/shared/components/toaster';

type Variables = {
  carePlanId: string;
  input: CreateTaskInput;
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, Variables>({
    mutationFn: ({ carePlanId, input }) => tasksApi.create(carePlanId, input),
    onSuccess: (_task, variables) => {
      toast.success('Task added');
      void queryClient.invalidateQueries({
        queryKey: carePlanTasksQueryKey(variables.carePlanId),
      });
      void queryClient.invalidateQueries({ queryKey: upcomingTasksQueryKey });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.detail : 'Could not add the task.';
      toast.error(message);
    },
  });
};
