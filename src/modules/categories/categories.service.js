import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { slugify } from '../../lib/slug.js';

export async function listAll() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function getBySlug(slug) {
  const cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) throw new NotFoundError('Category not found');
  return cat;
}

export async function create({ name, slug, description }) {
  const finalSlug = slug ? slugify(slug) : slugify(name);

  const [byName, bySlug] = await Promise.all([
    prisma.category.findUnique({ where: { name } }),
    prisma.category.findUnique({ where: { slug: finalSlug } }),
  ]);
  if (byName) throw new ConflictError('Category name already exists');
  if (bySlug) throw new ConflictError('Category slug already exists');

  return prisma.category.create({
    data: { name, slug: finalSlug, description: description ?? null },
  });
}

export async function update(id, data) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Category not found');

  const next = { ...data };
  if (next.slug) next.slug = slugify(next.slug);

  if (next.name && next.name !== existing.name) {
    const byName = await prisma.category.findUnique({ where: { name: next.name } });
    if (byName) throw new ConflictError('Category name already exists');
  }
  if (next.slug && next.slug !== existing.slug) {
    const bySlug = await prisma.category.findUnique({ where: { slug: next.slug } });
    if (bySlug) throw new ConflictError('Category slug already exists');
  }

  return prisma.category.update({ where: { id }, data: next });
}

export async function remove(id) {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!existing) throw new NotFoundError('Category not found');
  if (existing._count.products > 0) {
    throw new ConflictError('Cannot delete category with associated products');
  }
  await prisma.category.delete({ where: { id } });
}
