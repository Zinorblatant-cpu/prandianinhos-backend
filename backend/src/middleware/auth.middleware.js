import { errorFactory } from '../utils/errors.js';
import * as jwtUtils from '../utils/jwt.js';

function extractBearerToken(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') {
    return null;
  }

  const [scheme, token] = headerValue.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

export function buildAuthMiddleware(deps = {}) {
  const jwt = deps.jwt ?? jwtUtils;
  const errors = deps.errors ?? errorFactory;

  return async function authMiddleware(req, res, next) {
    try {
      const token = extractBearerToken(req.headers?.authorization);

      if (!token) {
        throw errors.unauthorized('Missing or invalid token');
      }

      const payload = jwt.verifyToken(token);

      req.user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles,
      };

      next();
    } catch (error) {
      next(errors.unauthorized('Missing or invalid token'));
    }
  };
}
