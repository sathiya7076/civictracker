import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters') // bcrypt only uses the first 72 bytes
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

const phone = z
  .union([
    z.literal('').transform(() => undefined),
    z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/, 'Enter a valid phone number'),
  ])
  .optional();

// Unknown keys (e.g. "role": "admin") are stripped by zod, so users can never choose their role.
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80)
    .transform((s) => s.replace(/[<>]/g, '')),
  email,
  password,
  phone,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(72),
});
