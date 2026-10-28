import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  makeAppError,
  makeConflictError,
  makeForbiddenError,
  makeNotFoundError,
  makeUnauthorizedError,
  makeValidationError,
} from '../../test/helpers/errors.js';
import { makeRequest, makeResponse } from '../../test/helpers/http.js';

async function loadErrorMiddleware() {
  const module = await import('../error.middleware.js');
  return module.errorMiddleware;
}

describe('errorMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('formats unauthorized errors as 401', async () => {
    const errorMiddleware = await loadErrorMiddleware();
    const error = makeUnauthorizedError('Missing or invalid token');
    const req = makeRequest();
    const res = makeResponse();
    const next = vi.fn();

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid token',
      },
    });
  });

  it('formats forbidden errors as 403', async () => {
    const errorMiddleware = await loadErrorMiddleware();
    const error = makeForbiddenError('Role not allowed');
    const req = makeRequest();
    const res = makeResponse();

    errorMiddleware(error, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'FORBIDDEN',
        message: 'Role not allowed',
      },
    });
  });

  it('formats not found errors as 404', async () => {
    const errorMiddleware = await loadErrorMiddleware();
    const error = makeNotFoundError('Post not found');
    const req = makeRequest();
    const res = makeResponse();

    errorMiddleware(error, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'NOT_FOUND',
        message: 'Post not found',
      },
    });
  });

  it('formats validation errors as 400 with details', async () => {
    const errorMiddleware = await loadErrorMiddleware();
    const error = makeValidationError('Invalid body', [
      { field: 'title', message: 'Required' },
    ]);
    const req = makeRequest();
    const res = makeResponse();

    errorMiddleware(error, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid body',
        details: [{ field: 'title', message: 'Required' }],
      },
    });
  });

  it('formats duplicate resource errors as 409', async () => {
    const errorMiddleware = await loadErrorMiddleware();
    const error = makeConflictError('Email already exists');
    const req = makeRequest();
    const res = makeResponse();

    errorMiddleware(error, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'CONFLICT',
        message: 'Email already exists',
      },
    });
  });

  it('falls back to 500 for unexpected errors', async () => {
    const errorMiddleware = await loadErrorMiddleware();
    const error = makeAppError({
      statusCode: undefined,
      code: undefined,
      message: 'Database exploded',
    });
    const req = makeRequest();
    const res = makeResponse();

    errorMiddleware(error, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  });
});
