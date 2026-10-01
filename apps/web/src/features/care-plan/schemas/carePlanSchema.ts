import { z } from 'zod';

export const CARE_PLAN_STATUSES = ['draft', 'active', 'completed', 'cancelled'] as const;

const emptyToNull = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? null : value;

const dateSchema = z.preprocess(
  emptyToNull,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .nullable(),
);

export const carePlanFormSchema = z
  .object({
    patient_email: z.string().email('Enter a valid email'),
    title: z.string().min(2, 'Title is required').max(255),
    description: z.preprocess(
      emptyToNull,
      z.string().max(5000, 'Description is too long').nullable(),
    ),
    start_at: dateSchema,
    end_at: dateSchema,
    status: z.enum(CARE_PLAN_STATUSES),
  })
  .refine(
    (data) => {
      if (!data.start_at || !data.end_at) return true;
      return data.start_at <= data.end_at;
    },
    { path: ['end_at'], message: 'End date must be on or after start date' },
  );

export type CarePlanFormValues = z.infer<typeof carePlanFormSchema>;

export const carePlanEditSchema = carePlanFormSchema.innerType().omit({ patient_email: true });

export type CarePlanEditValues = z.infer<typeof carePlanEditSchema>;
