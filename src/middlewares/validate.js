/**
 * Generic Zod validation middleware.
 *
 * Usage:
 *   validate({ body: schemaA, params: schemaB, query: schemaC })
 *
 * Each piece is optional. Successfully parsed values are written back to
 * req[piece], so downstream handlers see coerced/normalized data.
 */
export function validate(schemas = {}) {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        // req.query in Express is a getter on a parsed object — overwrite via assign
        const parsed = schemas.query.parse(req.query);
        Object.keys(req.query).forEach((k) => delete req.query[k]);
        Object.assign(req.query, parsed);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export default validate;
