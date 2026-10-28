const DEFAULT_TIMESTAMP = '2026-04-20T00:00:00.000Z';

export function makeUser(overrides = {}) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Regular User',
    email: 'user@example.com',
    password_hash: 'hashed-password',
    is_active: true,
    roles: ['USER'],
    created_at: DEFAULT_TIMESTAMP,
    updated_at: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

export function makeAuthor(overrides = {}) {
  return makeUser({
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Author User',
    email: 'author@example.com',
    roles: ['AUTHOR'],
    ...overrides,
  });
}

export function makeAdmin(overrides = {}) {
  return makeUser({
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Admin User',
    email: 'admin@example.com',
    roles: ['ADMIN'],
    ...overrides,
  });
}

export function makeSafeUser(user) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}
