import type {
  CarePlan,
  CarePlanApi,
  CreateCarePlanInput,
  UpdateCarePlanInput,
} from '@/features/care-plan/types';
import { apiClient } from '@/shared/api';

const CARE_PLANS = '/api/v1/care-plans';

export const carePlanApiReal: CarePlanApi = {
  async listMine(): Promise<CarePlan[]> {
    const { data } = await apiClient.get<CarePlan[]>(CARE_PLANS);
    return data;
  },

  async getById(id: string): Promise<CarePlan> {
    const { data } = await apiClient.get<CarePlan>(`${CARE_PLANS}/${id}`);
    return data;
  },

  async create(input: CreateCarePlanInput): Promise<CarePlan> {
    const { data } = await apiClient.post<CarePlan>(CARE_PLANS, input);
    return data;
  },

  async update(id: string, input: UpdateCarePlanInput): Promise<CarePlan> {
    const { data } = await apiClient.patch<CarePlan>(`${CARE_PLANS}/${id}`, input);
    return data;
  },
};
