import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAdmin, makeAuthor, makeUser } from '../../test/fixtures/users.js';
import { makeNext, makeRequest, makeResponse } from '../../test/helpers/http.js';

async function loadBuildRoleMiddleware() {
  const module = await import('../role.middleware.js');
  return module.buildRoleMiddleware;
}

function createDependencies() {
  return {
    rolesService: {
      hasRequiredRole: vi.fn(),
    },
  };
}

describe('buildRoleMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('guards protected role routes when authentication is missing', async () => {
    const buildRoleMiddleware = await loadBuildRoleMiddleware();
    const deps = createDependencies();
    const requireRoles = buildRoleMiddleware(deps);
    const middleware = requireRoles(['AUTHOR']);
    const req = makeRequest();
    const res = makeResponse();
    const next = makeNext();

    await middleware(req, res, next);

    expect(deps.rolesService.hasRequiredRole).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
      }),
    );
  });

  it('denies USER for author-only routes', async () => {
    const buildRoleMiddleware = await loadBuildRoleMiddleware();
    const deps = createDependencies();
    const requireRoles = buildRoleMiddleware(deps);
    const middleware = requireRoles(['AUTHOR']);
    const actor = makeUser();
    const req = makeRequest({ user: actor });
    const res = makeResponse();
    const next = makeNext();

    deps.rolesService.hasRequiredRole.mockReturnValue(false);

    await middleware(req, res, next);

    expect(deps.rolesService.hasRequiredRole).toHaveBeenCalledWith(actor, ['AUTHOR']);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
      }),
    );
  });

  it('allows AUTHOR for author routes', async () => {
    const buildRoleMiddleware = await loadBuildRoleMiddleware();
    const deps = createDependencies();
    const requireRoles = buildRoleMiddleware(deps);
    const middleware = requireRoles(['AUTHOR']);
    const actor = makeAuthor();
    const req = makeRequest({ user: actor });
    const res = makeResponse();
    const next = makeNext();

    deps.rolesService.hasRequiredRole.mockReturnValue(true);

    await middleware(req, res, next);

    expect(deps.rolesService.hasRequiredRole).toHaveBeenCalledWith(actor, ['AUTHOR']);
    expect(next).toHaveBeenCalledWith();
  });

  it('allows ADMIN for admin and global routes', async () => {
    const buildRoleMiddleware = await loadBuildRoleMiddleware();
    const deps = createDependencies();
    const requireRoles = buildRoleMiddleware(deps);
    const middleware = requireRoles(['ADMIN']);
    const actor = makeAdmin();
    const req = makeRequest({ user: actor });
    const res = makeResponse();
    const next = makeNext();

    deps.rolesService.hasRequiredRole.mockReturnValue(true);

    await middleware(req, res, next);

    expect(deps.rolesService.hasRequiredRole).toHaveBeenCalledWith(actor, ['ADMIN']);
    expect(next).toHaveBeenCalledWith();
  });
});
