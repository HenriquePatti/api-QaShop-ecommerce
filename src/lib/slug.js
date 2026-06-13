/**
 * Tiny slugifier — handles unicode, whitespace, punctuation.
 * Good enough for category/product names in a QA practice API.
 */
export function slugify(input) {
  return String(input ?? '')
    .normalize('NFKD')
    // Strip combining diacritical marks (U+0300 to U+036F)
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
