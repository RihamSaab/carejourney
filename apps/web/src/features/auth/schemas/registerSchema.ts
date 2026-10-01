import { z } from 'zod';

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Please enter your name'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .max(128, 'Password must be at most 128 characters'),
  role: z.enum(['patient', 'professional']),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
