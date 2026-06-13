import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { paginatedResponse, parsePagination } from '../../lib/pagination.js';
import { slugify } from '../../lib/slug.js';

function buildSort(sort) {
  if (!sort) return { createdAt: 'desc' };
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return { [field]: desc ? 'desc' : 'asc' };
}

export async function list(query) {
  const { page, pageSize, skip, take } = parsePagination(query);
  const { category, search, minPrice, maxPrice, active, inStock, sort } = query;

  const where = { AND: [] };
  if (category) where.AND.push({ category: { slug: category } });
  if (search) {
    // SQLite is case-sensitive for `contains` by default; we use both name+description.
    where.AND.push({
      OR: [
        { name: { contains: search } },
        { description: { contains: search } },
      ],
    });
  }
  if (minPrice !== undefined) where.AND.push({ price: { gte: minPrice } });
  if (maxPrice !== undefined) where.AND.push({ price: { lte: maxPrice } });
  if (active !== undefined) where.AND.push({ active });
  if (inStock === true) where.AND.push({ stock: { gt: 0 } });
  else if (inStock === false) where.AND.push({ stock: { lte: 0 } });
  if (where.AND.length === 0) delete where.AND;

  const [rawItems, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: buildSort(sort),
      include: {
        category: true,
        reviews: { select: { rating: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const items = rawItems.map(withReviewStats);
  return paginatedResponse({ data: items, page, pageSize, total });
}

/**
 * Computes `avgRating` and `reviewsCount` from the product's reviews and
 * strips the `reviews` array from the response. Reused by `getBySlug` and
 * `getById` to keep the `Product` shape consistent across read endpoints.
 */
function withReviewStats(product) {
  const reviewsCount = product.reviews.length;
  const avgRating =
    reviewsCount === 0
      ? null
      : Math.round((product.reviews.reduce((s, r) => s + r.rating, 0) / reviewsCount) * 100) / 100;

  const { reviews: _r, ...rest } = product;
  return { ...rest, avgRating, reviewsCount };
}

export async function getBySlug(slug) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true, reviews: { select: { rating: true } } },
  });
  if (!product) throw new NotFoundError('Product not found');
  return withReviewStats(product);
}

export async function getById(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, reviews: { select: { rating: true } } },
  });
  if (!product) throw new NotFoundError('Product not found');
  return withReviewStats(product);
}

/**
 * Related products = same category, active, with stock,
 * excluding the referenced product itself. Ordered by newest first.
 * Returns a plain `Product[]` (no pagination wrapper) — this powers a
 * fixed-size cross-sell strip.
 */
export async function getRelatedProducts(slug, limit = 4) {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, categoryId: true },
  });
  if (!product) throw new NotFoundError('Product not found');

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      active: true,
      stock: { gt: 0 },
      NOT: { id: product.id },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      category: true,
      reviews: { select: { rating: true } },
    },
  });

  return related.map(withReviewStats);
}

export async function create(data) {
  const finalSlug = data.slug ? slugify(data.slug) : slugify(data.name);
  const slugConflict = await prisma.product.findUnique({ where: { slug: finalSlug } });
  if (slugConflict) throw new ConflictError('Product slug already exists');

  const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!cat) throw new NotFoundError('Category not found');

  return prisma.product.create({
    data: { ...data, slug: finalSlug },
    include: { category: true },
  });
}

export async function update(id, data) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Product not found');

  const next = { ...data };
  if (next.slug) next.slug = slugify(next.slug);

  if (next.slug && next.slug !== existing.slug) {
    const conflict = await prisma.product.findUnique({ where: { slug: next.slug } });
    if (conflict) throw new ConflictError('Product slug already exists');
  }
  if (next.categoryId && next.categoryId !== existing.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: next.categoryId } });
    if (!cat) throw new NotFoundError('Category not found');
  }

  return prisma.product.update({
    where: { id },
    data: next,
    include: { category: true },
  });
}

export async function remove(id) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!existing) throw new NotFoundError('Product not found');

  if (existing._count.orderItems > 0) {
    // Soft delete: keep history intact
    return prisma.product.update({
      where: { id },
      data: { active: false },
      include: { category: true },
    });
  }
  // Hard delete: clean cart items first to avoid FK violations
  await prisma.cartItem.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  return null;
}
