import { useAuthStore } from '@/features/auth';
import type {
  CreateMedicationInput,
  Medication,
  MedicationEvent,
  MedicationsApi,
  UpdateMedicationEventInput,
} from '@/features/medications/types';
import { ApiError } from '@/shared/api';

const MEDICATIONS = new Map<string, Medication>();
const EVENTS = new Map<string, MedicationEvent>();
const HORIZON_DAYS = 30;
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

const addDays = (base: Date, days: number): Date => {
  const next = new Date(base.getTime());
  next.setDate(next.getDate() + days);
  return next;
};

const parseIsoDate = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
};

const materialiseEvents = (medication: Medication, patientId: string): MedicationEvent[] => {
  const start = parseIsoDate(medication.start_at);
  const naturalEnd = medication.end_at ? parseIsoDate(medication.end_at) : null;
  const horizonEnd = addDays(start, HORIZON_DAYS);
  const windowEnd = naturalEnd && naturalEnd < horizonEnd ? naturalEnd : horizonEnd;

  const events: MedicationEvent[] = [];
  const sortedHours = [...medication.frequency.hours].sort();

  for (let day = new Date(start.getTime()); day <= windowEnd; day = addDays(day, 1)) {
    for (const hhmm of sortedHours) {
      const [hour, minute] = hhmm.split(':').map(Number);
      const scheduled = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        hour ?? 0,
        minute ?? 0,
        0,
        0,
      );
      events.push({
        id: crypto.randomUUID(),
        medication_id: medication.id,
        medication_name: medication.name,
        medication_dosage: medication.dosage,
        patient_id: patientId,
        scheduled_at: scheduled.toISOString(),
        state: 'scheduled',
        acted_at: null,
      });
    }
  }
  return events;
};

const localDateKey = (iso: string): string => {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const medicationsApiMock: MedicationsApi = {
  async listForCarePlan(carePlanId: string): Promise<Medication[]> {
    await delay(jitter());
    currentUser();
    return Array.from(MEDICATIONS.values())
      .filter((med) => med.care_plan_id === carePlanId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async createForCarePlan(carePlanId: string, input: CreateMedicationInput): Promise<Medication> {
    await delay(jitter());
    maybeFail();
    requireProfessional();

    const patientId = `mock-patient-for-plan-${carePlanId}`;
    const medication: Medication = {
      id: crypto.randomUUID(),
      care_plan_id: carePlanId,
      patient_id: patientId,
      name: input.name,
      dosage: input.dosage,
      frequency: {
        times_per_day: input.frequency.times_per_day,
        hours: [...input.frequency.hours].sort(),
      },
      start_at: input.start_at,
      end_at: input.end_at ?? null,
      instructions: input.instructions ?? null,
      created_at: new Date().toISOString(),
    };
    MEDICATIONS.set(medication.id, medication);

    const events = materialiseEvents(medication, patientId);
    for (const event of events) {
      EVENTS.set(event.id, event);
    }
    return medication;
  },

  async listTodayForPatient(): Promise<MedicationEvent[]> {
    await delay(jitter());
    const user = requirePatient();
    const today = todayKey();
    return Array.from(EVENTS.values())
      .filter((event) => event.patient_id === user.id && localDateKey(event.scheduled_at) === today)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  },

  async updateEvent(eventId: string, input: UpdateMedicationEventInput): Promise<MedicationEvent> {
    await delay(jitter());
    maybeFail();
    const user = requirePatient();
    const event = EVENTS.get(eventId);
    if (!event) {
      throw new ApiError({
        code: 'not_found',
        title: 'Not found',
        detail: 'Dose not found.',
        status: 404,
      });
    }
    if (event.patient_id !== user.id) {
      throw new ApiError({
        code: 'forbidden',
        title: 'Forbidden',
        detail: 'You cannot update this dose.',
        status: 403,
      });
    }
    if (event.state !== 'scheduled') {
      throw new ApiError({
        code: 'conflict',
        title: 'Conflict',
        detail: 'This dose has already been recorded.',
        status: 409,
      });
    }

    const updated: MedicationEvent = {
      ...event,
      state: input.state,
      acted_at: new Date().toISOString(),
    };
    EVENTS.set(eventId, updated);
    return updated;
  },
};
