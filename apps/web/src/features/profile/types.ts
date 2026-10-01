import type { Role } from '@/features/auth';

export type EmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};

export type PatientProfile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  date_of_birth: string | null;
  phone: string | null;
  timezone: string;
  preferred_language: string;
  emergency_contact: EmergencyContact | null;
};

export type UpdatePatientProfileInput = {
  date_of_birth?: string | null;
  phone?: string | null;
  timezone?: string;
  preferred_language?: string;
  emergency_contact?: EmergencyContact | null;
};

export type ProfileApi = {
  getMe: () => Promise<PatientProfile>;
  update: (input: UpdatePatientProfileInput) => Promise<PatientProfile>;
};
