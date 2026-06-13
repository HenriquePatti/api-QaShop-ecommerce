import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().min(1) });

const isoDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid ISO date')
  .transform((s) => new Date(s));

export const createCouponSchema = z
  .object({
    code: z.string().trim().min(1).max(40).transform((s) => s.toUpperCase()),
    type: z.enum(['PERCENTAGE', 'FIXED']),
    value: z.number().positive(),
    minOrderValue: z.number().min(0).default(0),
    maxDiscount: z.number().positive().optional().nullable(),
    usageLimit: z.number().int().positive().optional().nullable(),
    perUserLimit: z.number().int().positive().default(1),
    validFrom: isoDate,
    validUntil: isoDate,
    active: z.boolean().default(true),
  })
  .refine((d) => d.validUntil > d.validFrom, {
    path: ['validUntil'],
    message: 'validUntil must be after validFrom',
  })
  .refine((d) => d.type !== 'PERCENTAGE' || d.value <= 100, {
    path: ['value'],
    message: 'PERCENTAGE coupon value cannot exceed 100',
  });

export const updateCouponSchema = z
  .object({
    code: z.string().trim().min(1).max(40).transform((s) => s.toUpperCase()).optional(),
    type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    value: z.number().positive().optional(),
    minOrderValue: z.number().min(0).optional(),
    maxDiscount: z.number().positive().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    perUserLimit: z.number().int().positive().optional(),
    validFrom: isoDate.optional(),
    validUntil: isoDate.optional(),
    active: z.boolean().optional(),
  })
  .strict();

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1).transform((s) => s.toUpperCase()),
  orderValue: z.number().min(0),
});
