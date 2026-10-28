import { errorFactory } from '../utils/errors.js';
import { buildRolesService } from '../modules/roles/roles.service.js';

export function buildRoleMiddleware(deps = {}) {
  const rolesService = deps.rolesService ?? buildRolesService();
  const errors = deps.errors ?? errorFactory;

  return function requireRoles(requiredRoles = []) {
    return async function roleMiddleware(req, res, next) {
      try {
        if (!req.user) {
          throw errors.unauthorized('Authentication required');
        }

        const allowed = rolesService.hasRequiredRole(req.user, requiredRoles);

        if (!allowed) {
          throw errors.forbidden('Role not allowed');
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };
}
