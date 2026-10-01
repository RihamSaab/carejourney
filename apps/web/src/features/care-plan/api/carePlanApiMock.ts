import { useAuthStore } from '@/features/auth';
import type {
  CarePlan,
  CarePlanApi,
  CreateCarePlanInput,
  UpdateCarePlanInput,
} from '@/features/care-plan/types';
import { ApiError } from '@/shared/api';

type StoredPlan = CarePlan & {
  patient_email_normalized: string;
  professional_email_normalized: string;
};

const PLANS = new Map<string, StoredPlan>();
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

const nameFromEmail = (email: string): string => {
  const local = email.split('@')[0] ?? email;
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const stripInternal = (stored: StoredPlan): CarePlan => {
  const { patient_email_normalized: _p, professional_email_normalized: _pr, ...rest } = stored;
  return rest;
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

const canAccess = (user: { email: string }, plan: StoredPlan): boolean => {
  const email = user.email.toLowerCase();
  return email === plan.patient_email_normalized || email === plan.professional_email_normalized;
};

export const carePlanApiMock: CarePlanApi = {
  async listMine(): Promise<CarePlan[]> {
    await delay(jitter());
    const user = currentUser();
    return Array.from(PLANS.values())
      .filter((plan) => canAccess(user, plan))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(stripInternal);
  },

  async getById(id: string): Promise<CarePlan> {
    await delay(jitter());
    const stored = PLANS.get(id);
    if (!stored) {
      throw new ApiError({
        code: 'not_found',
        title: 'Not found',
        detail: 'Care plan not found.',
        status: 404,
      });
    }
    const user = currentUser();
    if (!canAccess(user, stored)) {
      throw new ApiError({
        code: 'forbidden',
        title: 'Forbidden',
        detail: 'You do not have access to this care plan.',
        status: 403,
      });
    }
    return stripInternal(stored);
  },

  async create(input: CreateCarePlanInput): Promise<CarePlan> {
    await delay(jitter());
    maybeFail();
    const professional = requireProfessional();
    const now = new Date().toISOString();
    const patientEmail = input.patient_email.toLowerCase();

    const stored: StoredPlan = {
      id: crypto.randomUUID(),
      patient_id: `mock-patient-${patientEmail}`,
      patient_full_name: nameFromEmail(patientEmail),
      patient_email: patientEmail,
      patient_email_normalized: patientEmail,
      professional_id: professional.id,
      professional_full_name: professional.full_name,
      professional_email_normalized: professional.email.toLowerCase(),
      title: input.title,
      description: input.description ?? null,
      start_at: input.start_at ?? null,
      end_at: input.end_at ?? null,
      status: input.status ?? 'draft',
      created_at: now,
      updated_at: now,
    };
    PLANS.set(stored.id, stored);
    return stripInternal(stored);
  },

  async update(id: string, input: UpdateCarePlanInput): Promise<CarePlan> {
    await delay(jitter());
    maybeFail();
    const professional = requireProfessional();
    const stored = PLANS.get(id);
    if (!stored) {
      throw new ApiError({
        code: 'not_found',
        title: 'Not found',
        detail: 'Care plan not found.',
        status: 404,
      });
    }
    if (stored.professional_email_normalized !== professional.email.toLowerCase()) {
      throw new ApiError({
        code: 'forbidden',
        title: 'Forbidden',
        detail: 'Only the creating professional can update this plan.',
        status: 403,
      });
    }

    const updated: StoredPlan = {
      ...stored,
      ...input,
      description: input.description === undefined ? stored.description : input.description,
      start_at: input.start_at === undefined ? stored.start_at : input.start_at,
      end_at: input.end_at === undefined ? stored.end_at : input.end_at,
      updated_at: new Date().toISOString(),
    };
    PLANS.set(id, updated);
    return stripInternal(updated);
  },
};
