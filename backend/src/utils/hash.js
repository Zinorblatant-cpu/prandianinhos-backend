import bcrypt from 'bcrypt';

import { getEnv } from '../config/env.js';

export async function hashPassword(password) {
  const env = getEnv();
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
