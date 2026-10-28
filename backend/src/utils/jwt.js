import jsonwebtoken from 'jsonwebtoken';

import { getEnv } from '../config/env.js';

export function signToken(payload, options = {}) {
  const env = getEnv();

  return jsonwebtoken.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    ...options,
  });
}

export const generateToken = signToken;

export function verifyToken(token, options = {}) {
  const env = getEnv();
  return jsonwebtoken.verify(token, env.JWT_SECRET, options);
}
