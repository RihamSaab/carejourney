import type {
  Appointment,
  AppointmentsApi,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '@/features/appointments/types';
import { apiClient } from '@/shared/api';

const CARE_PLANS = '/api/v1/care-plans';
const APPOINTMENTS = '/api/v1/appointments';

export const appointmentsApiReal: AppointmentsApi = {
  async listForCarePlan(carePlanId: string): Promise<Appointment[]> {
    const { data } = await apiClient.get<Appointment[]>(
      `${CARE_PLANS}/${carePlanId}/appointments`,
    );
    return data;
  },

  async listUpcomingForPatient(): Promise<Appointment[]> {
    const { data } = await apiClient.get<Appointment[]>(APPOINTMENTS, {
      params: { scope: 'upcoming' },
    });
    return data;
  },

  async create(carePlanId: string, input: CreateAppointmentInput): Promise<Appointment> {
    const { data } = await apiClient.post<Appointment>(
      `${CARE_PLANS}/${carePlanId}/appointments`,
      input,
    );
    return data;
  },

  async update(appointmentId: string, input: UpdateAppointmentInput): Promise<Appointment> {
    const { data } = await apiClient.patch<Appointment>(
      `${APPOINTMENTS}/${appointmentId}`,
      input,
    );
    return data;
  },
};
