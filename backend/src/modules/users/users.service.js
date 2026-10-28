import { errorFactory } from '../../utils/errors.js';
import { buildUsersRepository } from './users.repository.js';

function sanitizeUser(user) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

export function buildUsersService(deps = {}) {
  const userRepository = deps.userRepository ?? buildUsersRepository();
  const errors = deps.errors ?? errorFactory;

  return {
    async getProfile(userId) {
      const user = await userRepository.findById(userId);

      if (!user) {
        throw errors.notFound('User not found');
      }

      return sanitizeUser(user);
    },
  };
}
