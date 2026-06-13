import { prisma } from '../../lib/prisma.js';
import {
  NotFoundError,
  UnprocessableEntityError,
} from '../../lib/errors.js';

/**
 * Ensure the user has a Cart row. Created lazily for users that pre-existed
 * the cart-on-register migration.
 */
async function ensureCart(userId) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });
  return cart;
}

/**
 * Corrige linhas duplicadas do mesmo produto (dados legados ou corrida).
 * Mantém a primeira linha e soma as quantidades nas demais.
 */
export async function consolidateDuplicateItems(cartId) {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    orderBy: { id: 'asc' },
    include: { product: true },
  });

  const groups = new Map();
  for (const it of items) {
    if (!groups.has(it.productId)) groups.set(it.productId, []);
    groups.get(it.productId).push(it);
  }

  await prisma.$transaction(async (tx) => {
    for (const rows of groups.values()) {
      if (rows.length <= 1) continue;
      const [keep, ...dupes] = rows;
      const mergedQty = keep.quantity + dupes.reduce((sum, row) => sum + row.quantity, 0);
      if (mergedQty > keep.product.stock) {
        throw new UnprocessableEntityError(
          `Only ${keep.product.stock} unit(s) available`,
          { code: 'INSUFFICIENT_STOCK', details: { available: keep.product.stock, requested: mergedQty } },
        );
      }
      await tx.cartItem.update({
        where: { id: keep.id },
        data: { quantity: mergedQty },
      });
      await tx.cartItem.deleteMany({
        where: { id: { in: dupes.map((row) => row.id) } },
      });
    }
  });
}

/** Consolida duplicatas do carrinho do usuário antes de operações críticas (ex.: pedido). */
export async function consolidateCartForUser(userId) {
  const cart = await ensureCart(userId);
  await consolidateDuplicateItems(cart.id);
  return cart.id;
}

function shapeCart(cart) {
  const items = (cart.items || []).map((it) => ({
    id: it.id,
    productId: it.productId,
    quantity: it.quantity,
    unitPrice: it.product?.price ?? null,
    lineTotal:
      it.product?.price != null ? Math.round(it.product.price * it.quantity * 100) / 100 : null,
    product: it.product,
  }));
  const subtotal =
    Math.round(items.reduce((s, it) => s + (it.lineTotal ?? 0), 0) * 100) / 100;
  const itemCount = items.reduce((s, it) => s + it.quantity, 0);
  return {
    id: cart.id,
    userId: cart.userId,
    items,
    subtotal,
    itemCount,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

export async function getCart(userId) {
  const cart = await ensureCart(userId);
  await consolidateDuplicateItems(cart.id);
  const full = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: { include: { category: true } } } } },
  });
  return shapeCart(full);
}

export async function addItem(userId, { productId, quantity }) {
  const cart = await ensureCart(userId);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product not found');
  if (!product.active) {
    throw new UnprocessableEntityError('Product is inactive', { code: 'PRODUCT_INACTIVE' });
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    const desired = (existing?.quantity ?? 0) + quantity;

    if (desired > product.stock) {
      throw new UnprocessableEntityError(
        `Only ${product.stock} unit(s) available`,
        { code: 'INSUFFICIENT_STOCK', details: { available: product.stock, requested: desired } }
      );
    }

    await tx.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity },
      update: { quantity: desired },
    });
  });

  return getCart(userId);
}

export async function updateItem(userId, productId, { quantity }) {
  const cart = await ensureCart(userId);
  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  if (!item) throw new NotFoundError('Cart item not found');

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return getCart(userId);
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product not found');
  if (!product.active) {
    throw new UnprocessableEntityError('Product is inactive', { code: 'PRODUCT_INACTIVE' });
  }
  if (quantity > product.stock) {
    throw new UnprocessableEntityError(
      `Only ${product.stock} unit(s) available`,
      { code: 'INSUFFICIENT_STOCK', details: { available: product.stock, requested: quantity } }
    );
  }

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  return getCart(userId);
}

export async function removeItem(userId, productId) {
  const cart = await ensureCart(userId);
  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  if (!item) throw new NotFoundError('Cart item not found');
  await prisma.cartItem.delete({ where: { id: item.id } });
  return getCart(userId);
}

export async function clearCart(userId) {
  const cart = await ensureCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return getCart(userId);
}
