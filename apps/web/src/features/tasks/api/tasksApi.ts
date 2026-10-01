import type { CreateTaskInput, Task, TasksApi, UpdateTaskInput } from '@/features/tasks/types';
import { apiClient } from '@/shared/api';

const CARE_PLANS = '/api/v1/care-plans';
const TASKS = '/api/v1/tasks';

export const tasksApiReal: TasksApi = {
  async listForCarePlan(carePlanId: string): Promise<Task[]> {
    const { data } = await apiClient.get<Task[]>(`${CARE_PLANS}/${carePlanId}/tasks`);
    return data;
  },

  async listUpcomingForPatient(): Promise<Task[]> {
    const { data } = await apiClient.get<Task[]>(TASKS, { params: { scope: 'upcoming' } });
    return data;
  },

  async create(carePlanId: string, input: CreateTaskInput): Promise<Task> {
    const { data } = await apiClient.post<Task>(`${CARE_PLANS}/${carePlanId}/tasks`, input);
    return data;
  },

  async update(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const { data } = await apiClient.patch<Task>(`${TASKS}/${taskId}`, input);
    return data;
  },
};
