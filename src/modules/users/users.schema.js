import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().min(1, 'id is required'),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(10).optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    // role explicitly omitted — cannot be changed via this endpoint
  })
  .strict();
