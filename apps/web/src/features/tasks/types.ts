export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'normal' | 'high';

export type Task = {
  id: string;
  care_plan_id: string;
  care_plan_title: string;
  patient_id: string;
  professional_id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  due_at?: string | null;
  priority?: TaskPriority;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  due_at?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
};

export type TasksApi = {
  listForCarePlan: (carePlanId: string) => Promise<Task[]>;
  listUpcomingForPatient: () => Promise<Task[]>;
  create: (carePlanId: string, input: CreateTaskInput) => Promise<Task>;
  update: (taskId: string, input: UpdateTaskInput) => Promise<Task>;
};
