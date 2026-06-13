import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { sanitizeUser } from '../../lib/sanitize.js';
import { parsePagination, paginatedResponse } from '../../lib/pagination.js';

export async function list(query) {
  const { page, pageSize, skip, take } = parsePagination(query);
  const [items, total] = await Promise.all([
    prisma.user.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.user.count(),
  ]);
  return paginatedResponse({
    data: items.map(sanitizeUser),
    page,
    pageSize,
    total,
  });
}

export async function getById(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  return sanitizeUser(user);
}

export async function update(id, data) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');

  if (data.email && data.email !== user.email) {
    const conflict = await prisma.user.findUnique({ where: { email: data.email } });
    if (conflict) throw new ConflictError('Email already in use');
  }

  const updated = await prisma.user.update({ where: { id }, data });
  return sanitizeUser(updated);
}

export async function remove(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  await prisma.user.delete({ where: { id } });
}

/**
 * Aggregated stats for the authenticated user.
 *   - `ordersCount`     : total orders (any status, including CANCELED).
 *   - `deliveredCount`  : orders currently in the DELIVERED state.
 *   - `totalSpent`      : sum of `total` for PAID/SHIPPED/DELIVERED orders
 *                         (excludes PENDING and CANCELED).
 *   - `isFirstPurchase` : true when the user has never placed an order.
 *
 * Powers banners like "primeiro pedido com frete grátis".
 *
 * Uses a single `groupBy` over `status` so the whole computation is one DB
 * round-trip, no matter how many orders the user has.
 */
export async function getMyStats(userId) {
  const grouped = await prisma.order.groupBy({
    by: ['status'],
    where: { userId },
    _count: { _all: true },
    _sum: { total: true },
  });

  let ordersCount = 0;
  let deliveredCount = 0;
  let totalSpent = 0;
  const SPEND_STATUSES = new Set(['PAID', 'SHIPPED', 'DELIVERED']);

  for (const row of grouped) {
    const count = row._count._all;
    ordersCount += count;
    if (row.status === 'DELIVERED') deliveredCount += count;
    if (SPEND_STATUSES.has(row.status)) {
      totalSpent += row._sum.total ?? 0;
    }
  }

  return {
    ordersCount,
    deliveredCount,
    totalSpent: Math.round(totalSpent * 100) / 100,
    isFirstPurchase: ordersCount === 0,
  };
}
