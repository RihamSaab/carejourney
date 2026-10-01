import type {
  Appointment,
  AppointmentsApi,
  AppointmentStatus,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '@/features/appointments/types';
import { useAuthStore } from '@/features/auth';
import { ApiError } from '@/shared/api';

type StoredAppointment = Appointment;

const APPOINTMENTS = new Map<string, StoredAppointment>();
const PLAN_META = new Map<string, { title: string }>();
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

const computeIsPast = (appt: StoredAppointment): boolean => {
  if (appt.status === 'completed' || appt.status === 'cancelled' || appt.status === 'no_show') {
    return false;
  }
  return new Date(appt.scheduled_at).getTime() < Date.now();
};

const withComputed = (appt: StoredAppointment): Appointment => ({
  ...appt,
  is_past: computeIsPast(appt),
});

const PATIENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  requested: ['cancelled'],
  scheduled: ['cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
};

const PROFESSIONAL_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  requested: ['scheduled', 'cancelled'],
  scheduled: ['completed', 'cancelled', 'no_show'],
  completed: ['scheduled'],
  cancelled: ['requested', 'scheduled'],
  no_show: ['scheduled'],
};

const ensurePlanMeta = (carePlanId: string): void => {
  if (PLAN_META.has(carePlanId)) return;
  PLAN_META.set(carePlanId, { title: 'Care plan' });
};

const sortByScheduled = (a: Appointment, b: Appointment): number =>
  a.scheduled_at.localeCompare(b.scheduled_at);

export const appointmentsApiMock: AppointmentsApi = {
  async listForCarePlan(carePlanId: string): Promise<Appointment[]> {
    await delay(jitter());
    currentUser();
    return Array.from(APPOINTMENTS.values())
      .filter((appt) => appt.care_plan_id === carePlanId)
      .map(withComputed)
      .sort(sortByScheduled);
  },

  async listUpcomingForPatient(): Promise<Appointment[]> {
    await delay(jitter());
    requirePatient();
    const now = Date.now();
    return Array.from(APPOINTMENTS.values())
      .filter(
        (appt) =>
          (appt.status === 'requested' || appt.status === 'scheduled') &&
          new Date(appt.scheduled_at).getTime() >= now - 60 * 60 * 1000,
      )
      .map(withComputed)
      .sort(sortByScheduled);
  },

  async create(carePlanId: string, input: CreateAppointmentInput): Promise<Appointment> {
    await delay(jitter());
    maybeFail();
    const user = currentUser();
    ensurePlanMeta(carePlanId);
    const meta = PLAN_META.get(carePlanId);
    const now = new Date().toISOString();
    const scheduledIso = new Date(input.scheduled_at).toISOString();
    const initialStatus: AppointmentStatus = user.role === 'patient' ? 'requested' : 'scheduled';
    const appt: StoredAppointment = {
      id: crypto.randomUUID(),
      care_plan_id: carePlanId,
      care_plan_title: meta?.title ?? 'Care plan',
      patient_id: user.role === 'patient' ? user.id : `mock-patient-for-plan-${carePlanId}`,
      professional_id:
        user.role === 'professional' ? user.id : `mock-pro-for-plan-${carePlanId}`,
      title: input.title,
      description: input.description ?? null,
      scheduled_at: scheduledIso,
      duration_minutes: input.duration_minutes,
      location_kind: input.location_kind,
      location_detail: input.location_detail ?? null,
      status: initialStatus,
      is_past: false,
      created_at: now,
      updated_at: now,
    };
    APPOINTMENTS.set(appt.id, appt);
    return withComputed(appt);
  },

  async update(appointmentId: string, input: UpdateAppointmentInput): Promise<Appointment> {
    await delay(jitter());
    maybeFail();
    const user = currentUser();
    const existing = APPOINTMENTS.get(appointmentId);
    if (!existing) {
      throw new ApiError({
        code: 'not_found',
        title: 'Not found',
        detail: 'Appointment not found.',
        status: 404,
      });
    }

    const isProfessional =
      user.role === 'professional' && user.id === existing.professional_id;
    const isPatient = user.role === 'patient';

    if (!isProfessional && !isPatient) {
      throw new ApiError({
        code: 'forbidden',
        title: 'Forbidden',
        detail: 'You cannot update this appointment.',
        status: 403,
      });
    }

    const touchingNonStatus =
      input.title !== undefined ||
      input.description !== undefined ||
      input.scheduled_at !== undefined ||
      input.duration_minutes !== undefined ||
      input.location_kind !== undefined ||
      input.location_detail !== undefined;

    if (isPatient && !isProfessional && touchingNonStatus) {
      throw new ApiError({
        code: 'unprocessable_entity',
        title: 'Unprocessable',
        detail: 'Patients may only change appointment status.',
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
          detail: `Cannot move appointment from ${existing.status} to ${input.status}.`,
          status: 422,
        });
      }
    }

    const updated: StoredAppointment = {
      ...existing,
      title: input.title ?? existing.title,
      description: input.description === undefined ? existing.description : input.description,
      scheduled_at:
        input.scheduled_at === undefined
          ? existing.scheduled_at
          : new Date(input.scheduled_at).toISOString(),
      duration_minutes: input.duration_minutes ?? existing.duration_minutes,
      location_kind: input.location_kind ?? existing.location_kind,
      location_detail:
        input.location_detail === undefined
          ? existing.location_detail
          : input.location_detail,
      status: input.status ?? existing.status,
      updated_at: new Date().toISOString(),
    };
    APPOINTMENTS.set(appointmentId, updated);
    return withComputed(updated);
  },
};
