import { errorFactory } from '../../utils/errors.js';
import * as hashUtils from '../../utils/hash.js';
import * as jwtUtils from '../../utils/jwt.js';
import { buildUsersRepository } from '../users/users.repository.js';
import { authValidators } from './auth.validators.js';

function sanitizeUser(user) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

export function buildAuthService(deps = {}) {
  const userRepository = deps.userRepository ?? buildUsersRepository();
  const hash = deps.hash ?? hashUtils;
  const jwt = deps.jwt ?? jwtUtils;
  const validators = deps.validators ?? authValidators;
  const errors = deps.errors ?? errorFactory;

  return {
    async register(input) {
      const payload = validators.validateRegister(input);
      const existingUser = await userRepository.findByEmail(payload.email);

      if (existingUser) {
        throw errors.conflict('Email already exists');
      }

      const password_hash = await hash.hashPassword(payload.password);
      const createdUser = await userRepository.create({
        name: payload.name,
        email: payload.email,
        password_hash,
        is_active: true,
        roles: ['USER'],
      });

      return sanitizeUser(createdUser);
    },

    async login(input) {
      const payload = validators.validateLogin(input);
      const user = await userRepository.findByEmail(payload.email);

      if (!user) {
        throw errors.unauthorized('Invalid credentials');
      }

      if (user.is_active === false) {
        throw errors.unauthorized('User account is inactive');
      }

      const isValidPassword = await hash.comparePassword(payload.password, user.password_hash);

      if (!isValidPassword) {
        throw errors.unauthorized('Invalid credentials');
      }

      const token = jwt.signToken({
        sub: user.id,
        email: user.email,
        roles: user.roles,
      });

      return {
        token,
        user: sanitizeUser(user),
      };
    },

    async getCurrentUser(userId) {
      const user = await userRepository.findById(userId);

      if (!user) {
        throw errors.notFound('User not found');
      }

      return sanitizeUser(user);
    },
  };
}
