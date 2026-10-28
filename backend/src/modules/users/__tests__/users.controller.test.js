import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAuthor, makeSafeUser } from '../../../test/fixtures/users.js';
import { makeUnauthorizedError } from '../../../test/helpers/errors.js';
import {
  makeNext,
  makeRequest,
  makeResponse,
} from '../../../test/helpers/http.js';

async function loadBuildUsersController() {
  const module = await import('../users.controller.js');
  return module.buildUsersController;
}

function createDependencies() {
  return {
    usersService: {
      getProfile: vi.fn(),
    },
    errors: {
      unauthorized: vi.fn((message) => makeUnauthorizedError(message)),
    },
  };
}

describe('buildUsersController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the authenticated user profile', async () => {
    const buildUsersController = await loadBuildUsersController();
    const deps = createDependencies();
    const actor = makeAuthor();
    const safeProfile = makeSafeUser(actor);

    deps.usersService.getProfile.mockResolvedValue(safeProfile);

    const controller = buildUsersController(deps);
    const req = makeRequest({ user: { id: actor.id, roles: actor.roles } });
    const res = makeResponse();
    const next = makeNext();

    await controller.getProfile(req, res, next);

    expect(deps.usersService.getProfile).toHaveBeenCalledWith(actor.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: safeProfile });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects profile retrieval without authentication', async () => {
    const buildUsersController = await loadBuildUsersController();
    const deps = createDependencies();

    const controller = buildUsersController(deps);
    const req = makeRequest();
    const res = makeResponse();
    const next = makeNext();

    await controller.getProfile(req, res, next);

    expect(deps.usersService.getProfile).not.toHaveBeenCalled();
    expect(deps.errors.unauthorized).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
      }),
    );
  });
});
