import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Validate a coupon for a given user against an order subtotal.
 * Returns a structured result rather than throwing — orders.service decides
 * whether to fail hard or surface the reason.
 *
 * Reason codes:
 *   COUPON_NOT_FOUND, INVALID_COUPON, COUPON_EXPIRED, COUPON_USAGE_EXCEEDED,
 *   PER_USER_LIMIT_EXCEEDED, MIN_ORDER_VALUE_NOT_MET
 */
export async function evaluateCoupon({ code, userId, orderValue }) {
  if (!code) {
    return { valid: true, discount: 0, finalValue: round2(orderValue), coupon: null };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    include: { _count: { select: { usages: true } } },
  });

  if (!coupon) {
    return {
      valid: false,
      discount: 0,
      finalValue: round2(orderValue),
      reason: 'Coupon not found',
      reasonCode: 'COUPON_NOT_FOUND',
    };
  }

  if (!coupon.active) {
    return {
      valid: false,
      discount: 0,
      finalValue: round2(orderValue),
      reason: 'Coupon is inactive',
      reasonCode: 'INVALID_COUPON',
      coupon,
    };
  }

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    return {
      valid: false,
      discount: 0,
      finalValue: round2(orderValue),
      reason: 'Coupon is outside its validity period',
      reasonCode: 'COUPON_EXPIRED',
      coupon,
    };
  }

  if (coupon.usageLimit != null && coupon._count.usages >= coupon.usageLimit) {
    return {
      valid: false,
      discount: 0,
      finalValue: round2(orderValue),
      reason: 'Coupon usage limit reached',
      reasonCode: 'COUPON_USAGE_EXCEEDED',
      coupon,
    };
  }

  if (userId && coupon.perUserLimit != null) {
    const userUsage = await prisma.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUsage >= coupon.perUserLimit) {
      return {
        valid: false,
        discount: 0,
        finalValue: round2(orderValue),
        reason: 'Per-user usage limit reached',
        reasonCode: 'COUPON_USAGE_EXCEEDED',
        coupon,
      };
    }
  }

  if (orderValue < coupon.minOrderValue) {
    return {
      valid: false,
      discount: 0,
      finalValue: round2(orderValue),
      reason: `Minimum order value of ${coupon.minOrderValue} not met`,
      reasonCode: 'INVALID_COUPON',
      coupon,
    };
  }

  let discount;
  if (coupon.type === 'PERCENTAGE') {
    discount = (orderValue * coupon.value) / 100;
    if (coupon.maxDiscount != null && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.value;
    if (discount > orderValue) discount = orderValue;
  }
  discount = round2(discount);
  const finalValue = round2(orderValue - discount);

  return { valid: true, discount, finalValue, coupon };
}

export async function listAll() {
  return prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { usages: true } } },
  });
}

export async function create(data) {
  const exists = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (exists) throw new ConflictError('Coupon code already exists');
  return prisma.coupon.create({ data });
}

export async function update(id, data) {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Coupon not found');

  if (data.code && data.code !== existing.code) {
    const conflict = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (conflict) throw new ConflictError('Coupon code already exists');
  }

  // Cross-field validation when both validFrom and validUntil could change
  const validFrom = data.validFrom ?? existing.validFrom;
  const validUntil = data.validUntil ?? existing.validUntil;
  if (validUntil <= validFrom) {
    throw new ConflictError('validUntil must be after validFrom');
  }

  return prisma.coupon.update({ where: { id }, data });
}

export async function remove(id) {
  const existing = await prisma.coupon.findUnique({
    where: { id },
    include: { _count: { select: { usages: true } } },
  });
  if (!existing) throw new NotFoundError('Coupon not found');

  if (existing._count.usages > 0) {
    return prisma.coupon.update({ where: { id }, data: { active: false } });
  }
  await prisma.coupon.delete({ where: { id } });
  return null;
}
