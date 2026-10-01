import { useMutation, useQueryClient } from '@tanstack/react-query';

import { tasksApi } from '@/features/tasks/api';
import { upcomingTasksQueryKey } from '@/features/tasks/hooks/useUpcomingTasks';
import type { Task, UpdateTaskInput } from '@/features/tasks/types';
import { ApiError } from '@/shared/api';
import { toast } from '@/shared/components/toaster';

type Variables = {
  taskId: string;
  input: UpdateTaskInput;
};

type Context = {
  previousUpcoming: Task[] | undefined;
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, Variables, Context>({
    mutationFn: ({ taskId, input }) => tasksApi.update(taskId, input),

    onMutate: async ({ taskId, input }) => {
      await queryClient.cancelQueries({ queryKey: upcomingTasksQueryKey });
      const previousUpcoming = queryClient.getQueryData<Task[]>(upcomingTasksQueryKey);
      if (previousUpcoming) {
        queryClient.setQueryData<Task[]>(
          upcomingTasksQueryKey,
          previousUpcoming.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...input,
                  description:
                    input.description === undefined ? task.description : input.description,
                  due_at: input.due_at === undefined ? task.due_at : input.due_at,
                }
              : task,
          ),
        );
      }
      return { previousUpcoming };
    },

    onError: (error, _variables, context) => {
      if (context?.previousUpcoming) {
        queryClient.setQueryData(upcomingTasksQueryKey, context.previousUpcoming);
      }
      const message = error instanceof ApiError ? error.detail : 'Could not update the task.';
      toast.error(message);
    },

    onSuccess: (task) => {
      queryClient.setQueryData(upcomingTasksQueryKey, (prev: Task[] | undefined) =>
        prev ? prev.map((t) => (t.id === task.id ? task : t)) : prev,
      );
      void queryClient.invalidateQueries({
        queryKey: ['tasks', 'care-plan', task.care_plan_id],
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: upcomingTasksQueryKey });
    },
  });
};
