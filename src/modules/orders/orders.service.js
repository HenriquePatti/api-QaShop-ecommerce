import { prisma } from '../../lib/prisma.js';
import {
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../lib/errors.js';
import { paginatedResponse, parsePagination } from '../../lib/pagination.js';
import { evaluateCoupon } from '../coupons/coupons.service.js';
import { consolidateCartForUser } from '../cart/cart.service.js';

const round2 = (n) => Math.round(n * 100) / 100;

const ORDER_INCLUDE = {
  items: true,
  user: { select: { id: true, name: true, email: true } },
};

export async function list(query, requester) {
  const { page, pageSize, skip, take } = parsePagination(query);
  const where = {};

  if (requester.role === 'ADMIN') {
    if (query.userId) where.userId = query.userId;
  } else {
    where.userId = requester.id;
  }
  if (query.status) where.status = query.status;
  // `productId` filters orders that contain at least one item with this
  // product, but does NOT alter the include — every returned order still
  // carries its full `items[]` (matching items + the rest of the cart).
  if (query.productId) {
    where.items = { some: { productId: query.productId } };
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: ORDER_INCLUDE,
    }),
    prisma.order.count({ where }),
  ]);

  return paginatedResponse({ data: items, page, pageSize, total });
}

export async function getById(id, requester) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: ORDER_INCLUDE,
  });
  if (!order) throw new NotFoundError('Order not found');
  if (requester.role !== 'ADMIN' && order.userId !== requester.id) {
    throw new ForbiddenError('You can only access your own orders');
  }
  return order;
}

/**
 * Create an order from the user's current cart.
 * Wrapped in a Prisma $transaction so partial failures roll back cleanly:
 *   - validates and decrements stock for each item
 *   - snapshots productName + unitPrice on each OrderItem
 *   - applies coupon (creates CouponUsage)
 *   - empties the cart
 */
export async function createFromCart(userId, { shippingAddress, couponCode }) {
  await consolidateCartForUser(userId);

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    throw new UnprocessableEntityError('Cart is empty', { code: 'EMPTY_CART' });
  }

  // Pre-flight: refuse on inactive products before opening the transaction
  for (const item of cart.items) {
    if (!item.product.active) {
      throw new UnprocessableEntityError(
        `Product "${item.product.name}" is inactive`,
        { code: 'PRODUCT_INACTIVE', details: { productId: item.product.id } }
      );
    }
  }

  // Compute subtotal & coupon BEFORE the transaction so we fail fast on coupon issues
  const subtotal = round2(
    cart.items.reduce((sum, it) => sum + it.product.price * it.quantity, 0)
  );

  let discount = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const evalResult = await evaluateCoupon({ code: couponCode, userId, orderValue: subtotal });
    if (!evalResult.valid) {
      throw new UnprocessableEntityError(evalResult.reason || 'Invalid coupon', {
        code: evalResult.reasonCode || 'INVALID_COUPON',
      });
    }
    discount = evalResult.discount;
    appliedCoupon = evalResult.coupon;
  }
  const total = round2(subtotal - discount);

  // Atomic part — re-validate stock with current DB values inside the txn
  const order = await prisma.$transaction(async (tx) => {
    // Re-check & decrement stock atomically for every cart item
    for (const item of cart.items) {
      const fresh = await tx.product.findUnique({ where: { id: item.productId } });
      if (!fresh) throw new NotFoundError(`Product ${item.productId} not found`);
      if (!fresh.active) {
        throw new UnprocessableEntityError(`Product "${fresh.name}" is inactive`, {
          code: 'PRODUCT_INACTIVE',
          details: { productId: fresh.id },
        });
      }
      if (fresh.stock < item.quantity) {
        throw new UnprocessableEntityError(
          `Insufficient stock for "${fresh.name}". Only ${fresh.stock} available`,
          {
            code: 'INSUFFICIENT_STOCK',
            details: { productId: fresh.id, available: fresh.stock, requested: item.quantity },
          }
        );
      }
      await tx.product.update({
        where: { id: fresh.id },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const created = await tx.order.create({
      data: {
        userId,
        status: 'PENDING',
        subtotal,
        discount,
        total,
        couponCode: appliedCoupon?.code ?? null,
        shippingAddress,
        items: {
          create: cart.items.map((it) => ({
            productId: it.productId,
            productName: it.product.name,
            unitPrice: it.product.price,
            quantity: it.quantity,
          })),
        },
      },
      include: ORDER_INCLUDE,
    });

    if (appliedCoupon) {
      // Re-check usage limits inside the txn to avoid races
      const totalUsage = await tx.couponUsage.count({ where: { couponId: appliedCoupon.id } });
      if (appliedCoupon.usageLimit != null && totalUsage >= appliedCoupon.usageLimit) {
        throw new UnprocessableEntityError('Coupon usage limit reached', {
          code: 'COUPON_USAGE_EXCEEDED',
        });
      }
      const userUsage = await tx.couponUsage.count({
        where: { couponId: appliedCoupon.id, userId },
      });
      if (appliedCoupon.perUserLimit != null && userUsage >= appliedCoupon.perUserLimit) {
        throw new UnprocessableEntityError('Per-user usage limit reached', {
          code: 'COUPON_USAGE_EXCEEDED',
        });
      }
      await tx.couponUsage.create({
        data: { couponId: appliedCoupon.id, userId, orderId: created.id },
      });
    }

    // Empty cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  return order;
}

async function transitionStatus(id, requester, { allowedFrom, to, dateField, requireRole, requireOwner }) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new NotFoundError('Order not found');

  if (requireRole && requester.role !== requireRole) {
    throw new ForbiddenError('Insufficient permissions');
  }
  if (requireOwner && requester.role !== 'ADMIN' && order.userId !== requester.id) {
    throw new ForbiddenError('You can only act on your own orders');
  }

  if (!allowedFrom.includes(order.status)) {
    throw new UnprocessableEntityError(
      `Order in status ${order.status} cannot transition to ${to}`,
      { code: 'INVALID_ORDER_STATUS', details: { current: order.status, target: to } }
    );
  }

  return prisma.order.update({
    where: { id },
    data: { status: to, [dateField]: new Date() },
    include: ORDER_INCLUDE,
  });
}

export function pay(id, requester) {
  return transitionStatus(id, requester, {
    allowedFrom: ['PENDING'],
    to: 'PAID',
    dateField: 'paidAt',
    requireOwner: true,
  });
}

export function ship(id, requester) {
  return transitionStatus(id, requester, {
    allowedFrom: ['PAID'],
    to: 'SHIPPED',
    dateField: 'shippedAt',
    requireRole: 'ADMIN',
  });
}

export function deliver(id, requester) {
  return transitionStatus(id, requester, {
    allowedFrom: ['SHIPPED'],
    to: 'DELIVERED',
    dateField: 'deliveredAt',
    requireRole: 'ADMIN',
  });
}

export async function cancel(id, requester) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, couponUsage: true },
  });
  if (!order) throw new NotFoundError('Order not found');

  if (requester.role !== 'ADMIN' && order.userId !== requester.id) {
    throw new ForbiddenError('You can only cancel your own orders');
  }

  if (!['PENDING', 'PAID'].includes(order.status)) {
    throw new UnprocessableEntityError(
      `Order in status ${order.status} cannot be canceled`,
      { code: 'INVALID_ORDER_STATUS', details: { current: order.status } }
    );
  }

  return prisma.$transaction(async (tx) => {
    // Restore stock
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    // Release the coupon usage
    if (order.couponUsage) {
      await tx.couponUsage.delete({ where: { id: order.couponUsage.id } });
    }
    return tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELED', canceledAt: new Date() },
      include: ORDER_INCLUDE,
    });
  });
}
