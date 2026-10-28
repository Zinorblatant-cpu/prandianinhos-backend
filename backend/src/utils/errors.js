export class AppError extends Error {
  constructor({
    name = 'AppError',
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    message = 'Internal server error',
    details,
    cause,
  } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function validation(message = 'Validation failed', details = []) {
  return new AppError({
    name: 'ValidationError',
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    message,
    details,
  });
}

export function unauthorized(message = 'Unauthorized') {
  return new AppError({
    name: 'UnauthorizedError',
    statusCode: 401,
    code: 'UNAUTHORIZED',
    message,
  });
}

export function forbidden(message = 'Forbidden') {
  return new AppError({
    name: 'ForbiddenError',
    statusCode: 403,
    code: 'FORBIDDEN',
    message,
  });
}

export function notFound(message = 'Not found') {
  return new AppError({
    name: 'NotFoundError',
    statusCode: 404,
    code: 'NOT_FOUND',
    message,
  });
}

export function conflict(message = 'Conflict', details = undefined) {
  return new AppError({
    name: 'ConflictError',
    statusCode: 409,
    code: 'CONFLICT',
    message,
    details,
  });
}

export function internal(message = 'Internal server error') {
  return new AppError({
    name: 'InternalError',
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message,
  });
}

export function isUniqueViolation(error, constraintNames = []) {
  if (!error || error.code !== '23505') {
    return false;
  }

  if (constraintNames.length === 0) {
    return true;
  }

  return constraintNames.includes(error.constraint);
}

export const errorFactory = {
  validation,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  internal,
};
