import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeLoginInput, makeRegisterInput } from '../../../test/fixtures/auth.js';
import { makeAuthor, makeSafeUser, makeUser } from '../../../test/fixtures/users.js';
import {
  makeConflictError,
  makeNotFoundError,
  makeUnauthorizedError,
} from '../../../test/helpers/errors.js';

async function loadBuildAuthService() {
  const module = await import('../auth.service.js');
  return module.buildAuthService;
}

function createDependencies() {
  return {
    userRepository: {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    },
    hash: {
      hashPassword: vi.fn(),
      comparePassword: vi.fn(),
    },
    jwt: {
      signToken: vi.fn(),
    },
    validators: {
      validateRegister: vi.fn((input) => input),
      validateLogin: vi.fn((input) => input),
    },
    errors: {
      conflict: vi.fn((message) => makeConflictError(message)),
      unauthorized: vi.fn((message) => makeUnauthorizedError(message)),
      notFound: vi.fn((message) => makeNotFoundError(message)),
    },
  };
}

describe('buildAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers a user and returns a safe payload', async () => {
    const buildAuthService = await loadBuildAuthService();
    const deps = createDependencies();
    const input = makeRegisterInput();
    const createdUser = makeUser({
      name: input.name,
      email: input.email,
    });

    deps.userRepository.findByEmail.mockResolvedValue(null);
    deps.hash.hashPassword.mockResolvedValue('hashed-password');
    deps.userRepository.create.mockResolvedValue(createdUser);

    const authService = buildAuthService(deps);
    const result = await authService.register(input);

    expect(deps.validators.validateRegister).toHaveBeenCalledWith(input);
    expect(deps.userRepository.findByEmail).toHaveBeenCalledWith(input.email);
    expect(deps.hash.hashPassword).toHaveBeenCalledWith(input.password);
    expect(deps.userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: input.name,
        email: input.email,
        password_hash: 'hashed-password',
      }),
    );
    expect(result).toEqual(makeSafeUser(createdUser));
    expect(result).not.toHaveProperty('password_hash');
  });

  it('rejects register when the email already exists', async () => {
    const buildAuthService = await loadBuildAuthService();
    const deps = createDependencies();
    const input = makeRegisterInput();

    deps.userRepository.findByEmail.mockResolvedValue(makeUser({ email: input.email }));

    const authService = buildAuthService(deps);

    await expect(authService.register(input)).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(deps.errors.conflict).toHaveBeenCalled();
    expect(deps.hash.hashPassword).not.toHaveBeenCalled();
    expect(deps.userRepository.create).not.toHaveBeenCalled();
  });

  it('logs in successfully and returns token plus safe user payload', async () => {
    const buildAuthService = await loadBuildAuthService();
    const deps = createDependencies();
    const input = makeLoginInput();
    const persistedUser = makeAuthor();

    deps.userRepository.findByEmail.mockResolvedValue(persistedUser);
    deps.hash.comparePassword.mockResolvedValue(true);
    deps.jwt.signToken.mockReturnValue('signed.jwt.token');

    const authService = buildAuthService(deps);
    const result = await authService.login(input);

    expect(deps.validators.validateLogin).toHaveBeenCalledWith(input);
    expect(deps.userRepository.findByEmail).toHaveBeenCalledWith(input.email);
    expect(deps.hash.comparePassword).toHaveBeenCalledWith(
      input.password,
      persistedUser.password_hash,
    );
    expect(deps.jwt.signToken).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: persistedUser.id,
        roles: persistedUser.roles,
      }),
    );
    expect(result).toEqual({
      token: 'signed.jwt.token',
      user: makeSafeUser(persistedUser),
    });
  });

  it('rejects login when the password is wrong', async () => {
    const buildAuthService = await loadBuildAuthService();
    const deps = createDependencies();
    const input = makeLoginInput();

    deps.userRepository.findByEmail.mockResolvedValue(makeAuthor());
    deps.hash.comparePassword.mockResolvedValue(false);

    const authService = buildAuthService(deps);

    await expect(authService.login(input)).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(deps.errors.unauthorized).toHaveBeenCalled();
    expect(deps.jwt.signToken).not.toHaveBeenCalled();
  });

  it('rejects login when the user does not exist', async () => {
    const buildAuthService = await loadBuildAuthService();
    const deps = createDependencies();
    const input = makeLoginInput({ email: 'missing@example.com' });

    deps.userRepository.findByEmail.mockResolvedValue(null);

    const authService = buildAuthService(deps);

    await expect(authService.login(input)).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(deps.errors.unauthorized).toHaveBeenCalled();
    expect(deps.hash.comparePassword).not.toHaveBeenCalled();
  });

  it('returns the current authenticated user without password_hash', async () => {
    const buildAuthService = await loadBuildAuthService();
    const deps = createDependencies();
    const persistedUser = makeAuthor();

    deps.userRepository.findById.mockResolvedValue(persistedUser);

    const authService = buildAuthService(deps);
    const result = await authService.getCurrentUser(persistedUser.id);

    expect(deps.userRepository.findById).toHaveBeenCalledWith(persistedUser.id);
    expect(result).toEqual(makeSafeUser(persistedUser));
    expect(result).not.toHaveProperty('password_hash');
  });

  it('rejects current user lookup when the token subject does not exist anymore', async () => {
    const buildAuthService = await loadBuildAuthService();
    const deps = createDependencies();

    deps.userRepository.findById.mockResolvedValue(null);

    const authService = buildAuthService(deps);

    await expect(
      authService.getCurrentUser('99999999-9999-9999-9999-999999999999'),
    ).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(deps.errors.notFound).toHaveBeenCalled();
  });
});
