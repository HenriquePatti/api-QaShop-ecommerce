import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';
import { sanitizeUser } from '../lib/sanitize.js';

/**
 * Require a valid JWT. Loads the matching user from the DB and attaches
 * the sanitized object to req.user (along with raw id/role for convenience).
 */
export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (!token || scheme.toLowerCase() !== 'bearer') {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') throw new UnauthorizedError('Token expired');
      throw new UnauthorizedError('Invalid token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedError('User no longer exists');

    req.user = sanitizeUser(user);
    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Authorize by role. Use AFTER authenticate.
 *   authorize('ADMIN')           -> only admin
 *   authorize('ADMIN','CUSTOMER') -> any of these roles
 */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError('Authentication required'));
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}

export const requireAdmin = authorize('ADMIN');
