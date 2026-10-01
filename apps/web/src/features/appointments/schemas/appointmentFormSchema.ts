import { z } from 'zod';

export const APPOINTMENT_LOCATION_KINDS = ['in_person', 'video', 'phone'] as const;

const emptyToNull = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? null : value;

export const appointmentFormSchema = z.object({
  title: z.string().min(2, 'Title is required').max(255),
  description: z.preprocess(emptyToNull, z.string().max(5000, 'Too long').nullable()),
  scheduled_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Pick a date and time'),
  duration_minutes: z.coerce
    .number()
    .int('Must be a whole number')
    .min(5, 'At least 5 minutes')
    .max(480, 'At most 8 hours'),
  location_kind: z.enum(APPOINTMENT_LOCATION_KINDS),
  location_detail: z.preprocess(emptyToNull, z.string().max(500, 'Too long').nullable()),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;
