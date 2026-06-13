import { z } from 'zod';

export const productIdParamSchema = z.object({ productId: z.string().min(1) });

export const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1, 'quantity must be at least 1'),
});

export const updateItemSchema = z.object({
  quantity: z.number().int().min(0, 'quantity cannot be negative'),
});
