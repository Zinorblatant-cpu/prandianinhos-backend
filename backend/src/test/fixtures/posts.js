const DEFAULT_TIMESTAMP = '2026-04-20T00:00:00.000Z';

export function makePost(overrides = {}) {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'How to Learn Node.js',
    slug: 'how-to-learn-nodejs',
    summary: 'A concise summary.',
    content: 'A long form post body.',
    status: 'DRAFT',
    author_id: '22222222-2222-2222-2222-222222222222',
    published_at: null,
    created_at: DEFAULT_TIMESTAMP,
    updated_at: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

export function makePublishedPost(overrides = {}) {
  return makePost({
    status: 'PUBLISHED',
    published_at: '2026-04-20T10:00:00.000Z',
    ...overrides,
  });
}

export function makeArchivedPost(overrides = {}) {
  return makePost({
    status: 'ARCHIVED',
    published_at: '2026-04-18T10:00:00.000Z',
    ...overrides,
  });
}

export function makeCreatePostInput(overrides = {}) {
  return {
    title: 'How to Learn Node.js',
    summary: 'A concise summary.',
    content: 'A long form post body.',
    ...overrides,
  };
}

export function makeUpdatePostInput(overrides = {}) {
  return {
    title: 'How to Learn Express',
    summary: 'An updated summary.',
    content: 'An updated post body.',
    ...overrides,
  };
}
