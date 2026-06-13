import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().min(1) });
export const productIdParamSchema = z.object({ productId: z.string().min(1) });

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(10).optional(),
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
  orderId: z.string().min(1),
});

export const updateReviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().max(1000).optional().nullable(),
  })
  .strict();
