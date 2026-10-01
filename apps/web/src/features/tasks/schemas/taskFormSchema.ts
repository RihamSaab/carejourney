import { z } from 'zod';

export const TASK_PRIORITIES = ['low', 'normal', 'high'] as const;

const emptyToNull = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? null : value;

export const taskFormSchema = z.object({
  title: z.string().min(2, 'Title is required').max(255),
  description: z.preprocess(emptyToNull, z.string().max(5000, 'Too long').nullable()),
  due_at: z.preprocess(
    emptyToNull,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
      .nullable(),
  ),
  priority: z.enum(TASK_PRIORITIES),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
