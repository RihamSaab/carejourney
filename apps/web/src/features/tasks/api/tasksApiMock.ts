import { useAuthStore } from '@/features/auth';
import type {
  CreateTaskInput,
  Task,
  TasksApi,
  TaskStatus,
  UpdateTaskInput,
} from '@/features/tasks/types';
import { ApiError } from '@/shared/api';

type StoredTask = Task;

const TASKS = new Map<string, StoredTask>();
const PLAN_META = new Map<
  string,
  { title: string; patient_email: string; professional_email: string }
>();
const FAILURE_RATE = 0.05;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const jitter = () => 180 + Math.floor(Math.random() * 180);

const currentUser = () => {
  const user = useAuthStore.getState().currentUser;
  if (!user) {
    throw new ApiError({
      code: 'unauthorized',
      title: 'Unauthorized',
      detail: 'Not signed in.',
      status: 401,
    });
  }
  return user;
};

const requireProfessional = () => {
  const user = currentUser();
  if (user.role !== 'professional') {
    throw new ApiError({
      code: 'forbidden',
      title: 'Forbidden',
      detail: 'Only healthcare professionals can perform this action.',
      status: 403,
    });
  }
  return user;
};

const requirePatient = () => {
  const user = currentUser();
  if (user.role !== 'patient') {
    throw new ApiError({
      code: 'forbidden',
      title: 'Forbidden',
      detail: 'Only patients can perform this action.',
      status: 403,
    });
  }
  return user;
};

const maybeFail = () => {
  if (Math.random() < FAILURE_RATE) {
    throw new ApiError({
      code: 'server_error',
      title: 'Server error',
      detail: 'Something went wrong. Try again.',
      status: 500,
    });
  }
};

const today = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const computeOverdue = (task: StoredTask): boolean => {
  if (task.status !== 'pending' || !task.due_at) return false;
  return task.due_at < today();
};

const withComputed = (task: StoredTask): Task => ({
  ...task,
  is_overdue: computeOverdue(task),
});

const PATIENT_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['in_progress', 'completed'],
  in_progress: ['pending', 'completed'],
  completed: [],
  cancelled: [],
};

const PROFESSIONAL_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['pending', 'completed', 'cancelled'],
  completed: ['in_progress', 'cancelled'],
  cancelled: ['pending'],
};

const ensurePlanMeta = (carePlanId: string): void => {
  if (PLAN_META.has(carePlanId)) return;
  const user = currentUser();
  const stub = {
    title: 'Care plan',
    patient_email: user.email.toLowerCase(),
    professional_email: user.email.toLowerCase(),
  };
  PLAN_META.set(carePlanId, stub);
};

export const tasksApiMock: TasksApi = {
  async listForCarePlan(carePlanId: string): Promise<Task[]> {
    await delay(jitter());
    currentUser();
    return Array.from(TASKS.values())
      .filter((task) => task.care_plan_id === carePlanId)
      .map(withComputed)
      .sort((a, b) => {
        const aPending = a.status === 'pending' ? 0 : 1;
        const bPending = b.status === 'pending' ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
        const aDue = a.due_at ?? '9999-12-31';
        const bDue = b.due_at ?? '9999-12-31';
        return aDue.localeCompare(bDue);
      });
  },

  async listUpcomingForPatient(): Promise<Task[]> {
    await delay(jitter());
    requirePatient();
    return Array.from(TASKS.values())
      .filter((task) => task.status === 'pending' || task.status === 'in_progress')
      .map(withComputed)
      .sort((a, b) => {
        const aDue = a.due_at ?? '9999-12-31';
        const bDue = b.due_at ?? '9999-12-31';
        return aDue.localeCompare(bDue);
      });
  },

  async create(carePlanId: string, input: CreateTaskInput): Promise<Task> {
    await delay(jitter());
    maybeFail();
    const professional = requireProfessional();
    ensurePlanMeta(carePlanId);
    const meta = PLAN_META.get(carePlanId);
    const now = new Date().toISOString();
    const task: StoredTask = {
      id: crypto.randomUUID(),
      care_plan_id: carePlanId,
      care_plan_title: meta?.title ?? 'Care plan',
      patient_id: `mock-patient-for-plan-${carePlanId}`,
      professional_id: professional.id,
      title: input.title,
      description: input.description ?? null,
      due_at: input.due_at ?? null,
      priority: input.priority ?? 'normal',
      status: 'pending',
      is_overdue: false,
      created_at: now,
      updated_at: now,
    };
    TASKS.set(task.id, task);
    return withComputed(task);
  },

  async update(taskId: string, input: UpdateTaskInput): Promise<Task> {
    await delay(jitter());
    maybeFail();
    const user = currentUser();
    const existing = TASKS.get(taskId);
    if (!existing) {
      throw new ApiError({
        code: 'not_found',
        title: 'Not found',
        detail: 'Task not found.',
        status: 404,
      });
    }

    const isProfessional = user.role === 'professional' && user.id === existing.professional_id;
    const isPatient = user.role === 'patient';

    if (!isProfessional && !isPatient) {
      throw new ApiError({
        code: 'forbidden',
        title: 'Forbidden',
        detail: 'You cannot update this task.',
        status: 403,
      });
    }

    const touchingNonStatus =
      input.title !== undefined ||
      input.description !== undefined ||
      input.due_at !== undefined ||
      input.priority !== undefined;

    if (isPatient && !isProfessional && touchingNonStatus) {
      throw new ApiError({
        code: 'unprocessable_entity',
        title: 'Unprocessable',
        detail: 'Patients may only change task status.',
        status: 422,
      });
    }

    if (input.status !== undefined && input.status !== existing.status) {
      const allowed = isProfessional
        ? PROFESSIONAL_TRANSITIONS[existing.status]
        : PATIENT_TRANSITIONS[existing.status];
      if (!allowed.includes(input.status)) {
        throw new ApiError({
          code: 'unprocessable_entity',
          title: 'Unprocessable',
          detail: `Cannot move task from ${existing.status} to ${input.status}.`,
          status: 422,
        });
      }
    }

    const updated: StoredTask = {
      ...existing,
      title: input.title ?? existing.title,
      description: input.description === undefined ? existing.description : input.description,
      due_at: input.due_at === undefined ? existing.due_at : input.due_at,
      priority: input.priority ?? existing.priority,
      status: input.status ?? existing.status,
      updated_at: new Date().toISOString(),
    };
    TASKS.set(taskId, updated);
    return withComputed(updated);
  },
};
