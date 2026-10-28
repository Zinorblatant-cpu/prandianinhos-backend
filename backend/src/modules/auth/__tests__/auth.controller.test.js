import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeRegisterInput, makeLoginInput } from '../../../test/fixtures/auth.js';
import { makeAuthor, makeSafeUser, makeUser } from '../../../test/fixtures/users.js';
import { makeUnauthorizedError } from '../../../test/helpers/errors.js';
import {
  makeNext,
  makeRequest,
  makeResponse,
} from '../../../test/helpers/http.js';

async function loadBuildAuthController() {
  const module = await import('../auth.controller.js');
  return module.buildAuthController;
}

function createDependencies() {
  return {
    authService: {
      register: vi.fn(),
      login: vi.fn(),
      getCurrentUser: vi.fn(),
    },
    errors: {
      unauthorized: vi.fn((message) => makeUnauthorizedError(message)),
    },
  };
}

describe('buildAuthController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('register responds with 201 and the sanitized user payload', async () => {
    const buildAuthController = await loadBuildAuthController();
    const deps = createDependencies();
    const input = makeRegisterInput();
    const registeredUser = makeSafeUser(makeUser({ email: input.email, name: input.name }));

    deps.authService.register.mockResolvedValue(registeredUser);

    const controller = buildAuthController(deps);
    const req = makeRequest({ body: input });
    const res = makeResponse();
    const next = makeNext();

    await controller.register(req, res, next);

    expect(deps.authService.register).toHaveBeenCalledWith(input);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ user: registeredUser });
    expect(next).not.toHaveBeenCalled();
  });

  it('login responds with token and safe user payload', async () => {
    const buildAuthController = await loadBuildAuthController();
    const deps = createDependencies();
    const input = makeLoginInput();
    const loginResult = {
      token: 'signed.jwt.token',
      user: makeSafeUser(makeAuthor()),
    };

    deps.authService.login.mockResolvedValue(loginResult);

    const controller = buildAuthController(deps);
    const req = makeRequest({ body: input });
    const res = makeResponse();
    const next = makeNext();

    await controller.login(req, res, next);

    expect(deps.authService.login).toHaveBeenCalledWith(input);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(loginResult);
    expect(next).not.toHaveBeenCalled();
  });

  it('me returns the current authenticated profile', async () => {
    const buildAuthController = await loadBuildAuthController();
    const deps = createDependencies();
    const currentUser = makeSafeUser(makeAuthor());

    deps.authService.getCurrentUser.mockResolvedValue(currentUser);

    const controller = buildAuthController(deps);
    const req = makeRequest({ user: { id: currentUser.id, roles: currentUser.roles } });
    const res = makeResponse();
    const next = makeNext();

    await controller.me(req, res, next);

    expect(deps.authService.getCurrentUser).toHaveBeenCalledWith(currentUser.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: currentUser });
    expect(next).not.toHaveBeenCalled();
  });

  it('me forwards unauthorized when authentication context is missing', async () => {
    const buildAuthController = await loadBuildAuthController();
    const deps = createDependencies();

    const controller = buildAuthController(deps);
    const req = makeRequest();
    const res = makeResponse();
    const next = makeNext();

    await controller.me(req, res, next);

    expect(deps.authService.getCurrentUser).not.toHaveBeenCalled();
    expect(deps.errors.unauthorized).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
      }),
    );
    expect(res.json).not.toHaveBeenCalled();
  });
});
