import { z } from 'zod';

export const SUPPORTED_TIMEZONES = [
  'UTC',
  'Asia/Riyadh',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
] as const;

export const SUPPORTED_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
] as const;

const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  phone: z.string().min(3, 'Phone is required').max(32),
  relationship: z.string().min(1, 'Relationship is required').max(64),
});

const emptyToNull = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? null : value;

export const profileSchema = z.object({
  date_of_birth: z.preprocess(
    emptyToNull,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
      .nullable(),
  ),
  phone: z.preprocess(
    emptyToNull,
    z.string().min(3, 'Phone is too short').max(32, 'Phone is too long').nullable(),
  ),
  timezone: z.enum(SUPPORTED_TIMEZONES),
  preferred_language: z.enum(['en', 'ar']),
  emergency_contact_enabled: z.boolean(),
  emergency_contact: emergencyContactSchema.optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
