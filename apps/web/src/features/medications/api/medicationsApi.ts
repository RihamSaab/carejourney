import type {
  CreateMedicationInput,
  Medication,
  MedicationEvent,
  MedicationsApi,
  UpdateMedicationEventInput,
} from '@/features/medications/types';
import { apiClient } from '@/shared/api';

const CARE_PLANS = '/api/v1/care-plans';
const EVENTS = '/api/v1/medication-events';

export const medicationsApiReal: MedicationsApi = {
  async listForCarePlan(carePlanId: string): Promise<Medication[]> {
    const { data } = await apiClient.get<Medication[]>(`${CARE_PLANS}/${carePlanId}/medications`);
    return data;
  },

  async createForCarePlan(carePlanId: string, input: CreateMedicationInput): Promise<Medication> {
    const { data } = await apiClient.post<Medication>(
      `${CARE_PLANS}/${carePlanId}/medications`,
      input,
    );
    return data;
  },

  async listTodayForPatient(): Promise<MedicationEvent[]> {
    const { data } = await apiClient.get<MedicationEvent[]>(EVENTS, {
      params: { date: 'today' },
    });
    return data;
  },

  async updateEvent(eventId: string, input: UpdateMedicationEventInput): Promise<MedicationEvent> {
    const { data } = await apiClient.patch<MedicationEvent>(`${EVENTS}/${eventId}`, input);
    return data;
  },
};
