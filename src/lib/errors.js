/**
 * Centralized error classes for the API.
 * Every operational error is an instance of AppError; the global error
 * handler turns it into the standard `{ error: { code, message, details } }`
 * response shape.
 */

export class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details) {
    super(message, { status: 400, code: 'VALIDATION_ERROR', details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details) {
    super(message, { status: 401, code: 'UNAUTHORIZED', details });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details) {
    super(message, { status: 403, code: 'FORBIDDEN', details });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details) {
    super(message, { status: 404, code: 'NOT_FOUND', details });
  }
}

export class ConflictError extends AppError {
  /**
   * @param {string} message
   * @param {object|undefined} optionsOrDetails  Either a `details` object or
   *   `{ code, details }`. If a plain object without a `code` field is passed,
   *   it is treated as `details` for backwards compatibility.
   */
  constructor(message = 'Conflict', optionsOrDetails) {
    let code = 'CONFLICT';
    let details;
    if (optionsOrDetails && typeof optionsOrDetails === 'object') {
      if ('code' in optionsOrDetails || 'details' in optionsOrDetails) {
        code = optionsOrDetails.code ?? 'CONFLICT';
        details = optionsOrDetails.details;
      } else {
        details = optionsOrDetails;
      }
    }
    super(message, { status: 409, code, details });
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable entity', { code = 'VALIDATION_ERROR', details } = {}) {
    super(message, { status: 422, code, details });
  }
}
