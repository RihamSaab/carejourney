export type CarePlanStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export type CarePlan = {
  id: string;
  patient_id: string;
  patient_full_name: string;
  patient_email: string;
  professional_id: string;
  professional_full_name: string;
  title: string;
  description: string | null;
  start_at: string | null;
  end_at: string | null;
  status: CarePlanStatus;
  created_at: string;
  updated_at: string;
};

export type CreateCarePlanInput = {
  patient_email: string;
  title: string;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  status?: CarePlanStatus;
};

export type UpdateCarePlanInput = {
  title?: string;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  status?: CarePlanStatus;
};

export type CarePlanApi = {
  listMine: () => Promise<CarePlan[]>;
  getById: (id: string) => Promise<CarePlan>;
  create: (input: CreateCarePlanInput) => Promise<CarePlan>;
  update: (id: string, input: UpdateCarePlanInput) => Promise<CarePlan>;
};
