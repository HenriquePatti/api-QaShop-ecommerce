import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().min(1) });
export const slugParamSchema = z.object({ slug: z.string().min(1) });

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(80).optional(),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url().max(500).optional().nullable(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    slug: z.string().trim().min(1).max(80).optional(),
    description: z.string().max(500).optional().nullable(),
    imageUrl: z.string().url().max(500).optional().nullable(),
  })
  .strict();
