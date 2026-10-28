import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeJwtPayload } from '../../test/fixtures/auth.js';
import { makeAuthor } from '../../test/fixtures/users.js';
import { makeAuthHeaders, makeNext, makeRequest, makeResponse } from '../../test/helpers/http.js';

async function loadBuildAuthMiddleware() {
  const module = await import('../auth.middleware.js');
  return module.buildAuthMiddleware;
}

function createDependencies() {
  return {
    jwt: {
      verifyToken: vi.fn(),
    },
  };
}

describe('buildAuthMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects protected routes without authorization header', async () => {
    const buildAuthMiddleware = await loadBuildAuthMiddleware();
    const deps = createDependencies();
    const middleware = buildAuthMiddleware(deps);
    const req = makeRequest();
    const res = makeResponse();
    const next = makeNext();

    await middleware(req, res, next);

    expect(deps.jwt.verifyToken).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
      }),
    );
  });

  it('rejects malformed bearer tokens', async () => {
    const buildAuthMiddleware = await loadBuildAuthMiddleware();
    const deps = createDependencies();
    const middleware = buildAuthMiddleware(deps);
    const req = makeRequest({
      headers: {
        authorization: 'Token abc.def.ghi',
      },
    });
    const res = makeResponse();
    const next = makeNext();

    await middleware(req, res, next);

    expect(deps.jwt.verifyToken).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
      }),
    );
  });

  it('rejects invalid JWT tokens', async () => {
    const buildAuthMiddleware = await loadBuildAuthMiddleware();
    const deps = createDependencies();
    const middleware = buildAuthMiddleware(deps);
    const req = makeRequest({
      headers: makeAuthHeaders('bad.token'),
    });
    const res = makeResponse();
    const next = makeNext();

    deps.jwt.verifyToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await middleware(req, res, next);

    expect(deps.jwt.verifyToken).toHaveBeenCalledWith('bad.token');
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
      }),
    );
  });

  it('injects authenticated user context into the request', async () => {
    const buildAuthMiddleware = await loadBuildAuthMiddleware();
    const deps = createDependencies();
    const actor = makeAuthor();
    const middleware = buildAuthMiddleware(deps);
    const req = makeRequest({
      headers: makeAuthHeaders('signed.jwt.token'),
    });
    const res = makeResponse();
    const next = makeNext();

    deps.jwt.verifyToken.mockReturnValue(makeJwtPayload(actor));

    await middleware(req, res, next);

    expect(deps.jwt.verifyToken).toHaveBeenCalledWith('signed.jwt.token');
    expect(req.user).toEqual(
      expect.objectContaining({
        id: actor.id,
        email: actor.email,
        roles: actor.roles,
      }),
    );
    expect(next).toHaveBeenCalledWith();
  });
});
