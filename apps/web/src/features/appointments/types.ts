export type AppointmentStatus =
  | 'requested'
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AppointmentLocationKind = 'in_person' | 'video' | 'phone';

export type Appointment = {
  id: string;
  care_plan_id: string;
  care_plan_title: string;
  patient_id: string;
  professional_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  location_kind: AppointmentLocationKind;
  location_detail: string | null;
  status: AppointmentStatus;
  is_past: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateAppointmentInput = {
  title: string;
  description?: string | null;
  scheduled_at: string;
  duration_minutes: number;
  location_kind: AppointmentLocationKind;
  location_detail?: string | null;
};

export type UpdateAppointmentInput = {
  title?: string;
  description?: string | null;
  scheduled_at?: string;
  duration_minutes?: number;
  location_kind?: AppointmentLocationKind;
  location_detail?: string | null;
  status?: AppointmentStatus;
};

export type AppointmentsApi = {
  listForCarePlan: (carePlanId: string) => Promise<Appointment[]>;
  listUpcomingForPatient: () => Promise<Appointment[]>;
  create: (carePlanId: string, input: CreateAppointmentInput) => Promise<Appointment>;
  update: (appointmentId: string, input: UpdateAppointmentInput) => Promise<Appointment>;
};
