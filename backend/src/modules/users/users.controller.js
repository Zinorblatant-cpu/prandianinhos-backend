import { errorFactory } from '../../utils/errors.js';

export function buildUsersController(deps = {}) {
  const { usersService, errors = errorFactory } = deps;

  return {
    async getProfile(req, res, next) {
      try {
        if (!req.user?.id) {
          throw errors.unauthorized('Authentication required');
        }

        const user = await usersService.getProfile(req.user.id);
        res.status(200).json({ user });
      } catch (error) {
        next(error);
      }
    },
  };
}
