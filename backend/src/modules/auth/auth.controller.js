import { errorFactory } from '../../utils/errors.js';

export function buildAuthController(deps = {}) {
  const { authService, errors = errorFactory } = deps;

  return {
    async register(req, res, next) {
      try {
        const user = await authService.register(req.body);
        res.status(201).json({ user });
      } catch (error) {
        next(error);
      }
    },

    async login(req, res, next) {
      try {
        const result = await authService.login(req.body);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    async me(req, res, next) {
      try {
        if (!req.user?.id) {
          throw errors.unauthorized('Authentication required');
        }

        const user = await authService.getCurrentUser(req.user.id);
        res.status(200).json({ user });
      } catch (error) {
        next(error);
      }
    },
  };
}
