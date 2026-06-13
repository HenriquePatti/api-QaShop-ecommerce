import { prisma } from '../../lib/prisma.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../lib/errors.js';
import { paginatedResponse, parsePagination } from '../../lib/pagination.js';

export async function listForProduct(productId, query) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product not found');

  const { page, pageSize, skip, take } = parsePagination(query);
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.review.count({ where: { productId } }),
  ]);
  return paginatedResponse({ data: items, page, pageSize, total });
}

export async function create(userId, productId, { rating, comment, orderId }) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product not found');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new NotFoundError('Order not found');
  if (order.userId !== userId) {
    throw new ForbiddenError('Order does not belong to this user');
  }
  if (order.status !== 'DELIVERED') {
    throw new UnprocessableEntityError('Order has not been delivered yet', {
      code: 'ORDER_NOT_DELIVERED',
    });
  }
  if (!order.items.some((it) => it.productId === productId)) {
    throw new UnprocessableEntityError('Order does not contain this product', {
      code: 'ORDER_NOT_DELIVERED',
    });
  }

  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) {
    throw new ConflictError('You have already reviewed this product', { code: 'ALREADY_REVIEWED' });
  }

  return prisma.review.create({
    data: { userId, productId, orderId, rating, comment: comment ?? null },
  });
}

export async function update(id, requester, data) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new NotFoundError('Review not found');
  if (review.userId !== requester.id && requester.role !== 'ADMIN') {
    throw new ForbiddenError('You can only update your own reviews');
  }
  return prisma.review.update({ where: { id }, data });
}

export async function remove(id, requester) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new NotFoundError('Review not found');
  if (review.userId !== requester.id && requester.role !== 'ADMIN') {
    throw new ForbiddenError('You can only delete your own reviews');
  }
  await prisma.review.delete({ where: { id } });
}
