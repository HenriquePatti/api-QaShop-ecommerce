/**
 * Helpers for paginated responses.
 *
 * Default page=1, default pageSize=10, max pageSize=100.
 * Always returns `{ data, meta: { page, pageSize, total, totalPages } }`.
 */

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export function parsePagination({ page, pageSize } = {}) {
  let p = Number.parseInt(page, 10);
  let s = Number.parseInt(pageSize, 10);

  if (!Number.isFinite(p) || p < 1) p = DEFAULT_PAGE;
  if (!Number.isFinite(s) || s < 1) s = DEFAULT_PAGE_SIZE;
  if (s > MAX_PAGE_SIZE) s = MAX_PAGE_SIZE;

  return { page: p, pageSize: s, skip: (p - 1) * s, take: s };
}

export function buildMeta({ page, pageSize, total }) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return { page, pageSize, total, totalPages };
}

export function paginatedResponse({ data, page, pageSize, total }) {
  return { data, meta: buildMeta({ page, pageSize, total }) };
}
