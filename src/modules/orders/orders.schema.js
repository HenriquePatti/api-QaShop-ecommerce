import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().min(1) });

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(10).optional(),
  userId: z.string().min(1).optional(),
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED']).optional(),
  productId: z.string().min(1).optional(),
});

export const createOrderSchema = z.object({
  shippingAddress: z.string().trim().min(1).max(500),
  couponCode: z
    .string()
    .trim()
    .min(1)
    .transform((s) => s.toUpperCase())
    .optional()
    .nullable(),
});
