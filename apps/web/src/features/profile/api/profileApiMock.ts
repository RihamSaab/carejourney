import { useAuthStore } from '@/features/auth';
import type {
  PatientProfile,
  ProfileApi,
  UpdatePatientProfileInput,
} from '@/features/profile/types';
import { ApiError } from '@/shared/api';

const STORE = new Map<string, PatientProfile>();
const FAILURE_RATE = 0.05;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const jitter = () => 150 + Math.floor(Math.random() * 180);

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

const seed = (): PatientProfile => {
  const user = currentUser();
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    date_of_birth: null,
    phone: null,
    timezone: 'UTC',
    preferred_language: 'en',
    emergency_contact: null,
  };
};

const ensureProfile = (): PatientProfile => {
  const user = currentUser();
  const existing = STORE.get(user.id);
  if (existing) return existing;
  const fresh = seed();
  STORE.set(user.id, fresh);
  return fresh;
};

export const profileApiMock: ProfileApi = {
  async getMe(): Promise<PatientProfile> {
    await delay(jitter());
    return { ...ensureProfile() };
  },

  async update(input: UpdatePatientProfileInput): Promise<PatientProfile> {
    await delay(jitter());

    if (Math.random() < FAILURE_RATE) {
      throw new ApiError({
        code: 'server_error',
        title: 'Server error',
        detail: 'Something went wrong saving your profile. Try again.',
        status: 500,
      });
    }

    const current = ensureProfile();
    const updated: PatientProfile = {
      ...current,
      ...input,
    };
    STORE.set(current.id, updated);
    return { ...updated };
  },
};
