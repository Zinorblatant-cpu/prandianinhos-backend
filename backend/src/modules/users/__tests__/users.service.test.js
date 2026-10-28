import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAuthor, makeSafeUser } from '../../../test/fixtures/users.js';
import { makeNotFoundError } from '../../../test/helpers/errors.js';

async function loadBuildUsersService() {
  const module = await import('../users.service.js');
  return module.buildUsersService;
}

function createDependencies() {
  return {
    userRepository: {
      findById: vi.fn(),
    },
    errors: {
      notFound: vi.fn((message) => makeNotFoundError(message)),
    },
  };
}

describe('buildUsersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves a profile successfully and strips password_hash', async () => {
    const buildUsersService = await loadBuildUsersService();
    const deps = createDependencies();
    const persistedUser = makeAuthor();

    deps.userRepository.findById.mockResolvedValue(persistedUser);

    const usersService = buildUsersService(deps);
    const profile = await usersService.getProfile(persistedUser.id);

    expect(deps.userRepository.findById).toHaveBeenCalledWith(persistedUser.id);
    expect(profile).toEqual(makeSafeUser(persistedUser));
    expect(profile).not.toHaveProperty('password_hash');
  });

  it('rejects profile retrieval when the user does not exist', async () => {
    const buildUsersService = await loadBuildUsersService();
    const deps = createDependencies();

    deps.userRepository.findById.mockResolvedValue(null);

    const usersService = buildUsersService(deps);

    await expect(
      usersService.getProfile('99999999-9999-9999-9999-999999999999'),
    ).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(deps.errors.notFound).toHaveBeenCalled();
  });
});
