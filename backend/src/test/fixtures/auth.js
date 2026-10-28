export function makeRegisterInput(overrides = {}) {
  return {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'Password123!',
    ...overrides,
  };
}

export function makeLoginInput(overrides = {}) {
  return {
    email: 'author@example.com',
    password: 'Password123!',
    ...overrides,
  };
}

export function makeJwtPayload(user, overrides = {}) {
  return {
    sub: user.id,
    email: user.email,
    roles: user.roles,
    ...overrides,
  };
}
