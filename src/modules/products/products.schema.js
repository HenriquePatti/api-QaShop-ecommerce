import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().min(1) });
export const slugParamSchema = z.object({ slug: z.string().min(1) });

export const relatedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(12).default(4),
});

const SORTS = ['price', '-price', 'name', '-name', 'createdAt', '-createdAt'];

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(10).optional(),
  category: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  active: z
    .union([z.enum(['true', 'false']), z.boolean()])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
  inStock: z
    .union([z.enum(['true', 'false']), z.boolean()])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
  sort: z.enum(SORTS).optional(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(150),
  slug: z.string().trim().min(1).max(150).optional(),
  description: z.string().min(1).max(2000),
  price: z.number().positive('price must be greater than 0'),
  stock: z.number().int().min(0, 'stock cannot be negative').default(0),
  active: z.boolean().default(true),
  imageUrl: z.string().trim().url().max(2000).nullable().optional(),
  categoryId: z.string().min(1),
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    slug: z.string().trim().min(1).max(150).optional(),
    description: z.string().min(1).max(2000).optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    active: z.boolean().optional(),
    imageUrl: z.string().trim().url().max(2000).nullable().optional(),
    categoryId: z.string().min(1).optional(),
  })
  .strict();
