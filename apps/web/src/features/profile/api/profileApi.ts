import type {
  PatientProfile,
  ProfileApi,
  UpdatePatientProfileInput,
} from '@/features/profile/types';
import { apiClient } from '@/shared/api';

const PATIENTS = '/api/v1/patients';

export const profileApiReal: ProfileApi = {
  async getMe(): Promise<PatientProfile> {
    const { data } = await apiClient.get<PatientProfile>(`${PATIENTS}/me`);
    return data;
  },

  async update(input: UpdatePatientProfileInput): Promise<PatientProfile> {
    const { data } = await apiClient.patch<PatientProfile>(`${PATIENTS}/me`, input);
    return data;
  },
};
