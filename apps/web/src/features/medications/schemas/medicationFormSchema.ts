import { z } from 'zod';

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const emptyToNull = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? null : value;

export const medicationFormSchema = z
  .object({
    name: z.string().min(2, 'Name is required').max(255),
    dosage: z.string().min(1, 'Dosage is required').max(128),
    times_per_day: z.coerce.number().int().min(1, 'At least once a day').max(6, 'Max 6 per day'),
    hours_text: z
      .string()
      .min(1, 'List the times')
      .refine(
        (value) =>
          value
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean)
            .every((part) => HHMM.test(part)),
        'Use HH:MM separated by commas (24-hour)',
      ),
    start_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
    end_at: z.preprocess(
      emptyToNull,
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
        .nullable(),
    ),
    instructions: z.preprocess(emptyToNull, z.string().max(2000, 'Too long').nullable()),
  })
  .refine(
    (data) => {
      const hours = data.hours_text
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
      return hours.length === data.times_per_day;
    },
    { path: ['hours_text'], message: 'Number of times must match times per day' },
  )
  .refine(
    (data) => {
      if (!data.end_at) return true;
      return data.start_at <= data.end_at;
    },
    { path: ['end_at'], message: 'End date must be on or after start date' },
  );

export type MedicationFormValues = z.infer<typeof medicationFormSchema>;

export const parseHours = (text: string): string[] =>
  text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .sort();
