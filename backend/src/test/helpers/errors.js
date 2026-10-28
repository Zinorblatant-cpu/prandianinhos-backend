export function makeAppError({
  name = 'AppError',
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  message = 'Unexpected error',
  details,
} = {}) {
  return {
    name,
    statusCode,
    code,
    message,
    details,
  };
}

export function makeValidationError(
  message = 'Validation failed',
  details = [{ field: 'email', message: 'Invalid email' }],
) {
  return makeAppError({
    name: 'ValidationError',
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    message,
    details,
  });
}

export function makeUnauthorizedError(message = 'Unauthorized') {
  return makeAppError({
    name: 'UnauthorizedError',
    statusCode: 401,
    code: 'UNAUTHORIZED',
    message,
  });
}

export function makeForbiddenError(message = 'Forbidden') {
  return makeAppError({
    name: 'ForbiddenError',
    statusCode: 403,
    code: 'FORBIDDEN',
    message,
  });
}

export function makeNotFoundError(message = 'Not found') {
  return makeAppError({
    name: 'NotFoundError',
    statusCode: 404,
    code: 'NOT_FOUND',
    message,
  });
}

export function makeConflictError(message = 'Conflict') {
  return makeAppError({
    name: 'ConflictError',
    statusCode: 409,
    code: 'CONFLICT',
    message,
  });
}
