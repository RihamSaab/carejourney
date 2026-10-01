export type MedicationFrequency = {
  times_per_day: number;
  hours: string[];
};

export type Medication = {
  id: string;
  care_plan_id: string;
  patient_id: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  start_at: string;
  end_at: string | null;
  instructions: string | null;
  created_at: string;
};

export type MedicationEventState = 'scheduled' | 'taken' | 'skipped' | 'snoozed';

export type MedicationEvent = {
  id: string;
  medication_id: string;
  medication_name: string;
  medication_dosage: string;
  patient_id: string;
  scheduled_at: string;
  state: MedicationEventState;
  acted_at: string | null;
};

export type CreateMedicationInput = {
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  start_at: string;
  end_at?: string | null;
  instructions?: string | null;
};

export type UpdateMedicationEventInput = {
  state: Exclude<MedicationEventState, 'scheduled'>;
};

export type MedicationsApi = {
  listForCarePlan: (carePlanId: string) => Promise<Medication[]>;
  createForCarePlan: (carePlanId: string, input: CreateMedicationInput) => Promise<Medication>;
  listTodayForPatient: () => Promise<MedicationEvent[]>;
  updateEvent: (eventId: string, input: UpdateMedicationEventInput) => Promise<MedicationEvent>;
};
