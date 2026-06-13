import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

/**
 * Global error handler. Converts AppError, ZodError, and unknown errors
 * into the standard `{ error: { code, message, details? } }` payload.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.flatten(),
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
  }

  // JWT-related errors (jsonwebtoken throws plain Error subclasses with `name`)
  if (err && (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
      },
    });
  }

  // Body parser / SyntaxError
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Malformed JSON body' },
    });
  }

  // Fallback
  const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
  return res.status(status).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err?.message || 'Internal server error',
    },
  });
}

export default errorHandler;
