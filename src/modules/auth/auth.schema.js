import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  // OWASP recommends a maximum password length around 64 characters;
  // this also stays under bcrypt's 72-byte truncation limit.
  .max(64, 'Password must be at most 64 characters')
  .refine((p) => /[A-Z]/.test(p), 'Password must contain at least 1 uppercase letter')
  .refine((p) => /[0-9]/.test(p), 'Password must contain at least 1 number');

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  // RFC 5321 caps the maximum email address length at 254 characters.
  email: z.string().trim().toLowerCase().email('Invalid email').max(254, 'Email must be at most 254 characters'),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
