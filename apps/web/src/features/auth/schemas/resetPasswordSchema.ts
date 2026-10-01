import { z } from 'zod';

export const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(10, 'Password must be at least 10 characters')
      .max(128, 'Password must be at most 128 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
