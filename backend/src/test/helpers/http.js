import { vi } from 'vitest';

export function makeRequest(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    ...overrides,
  };
}

export function makeResponse() {
  const response = {
    statusCode: 200,
    body: undefined,
  };

  response.status = vi.fn((statusCode) => {
    response.statusCode = statusCode;
    return response;
  });

  response.json = vi.fn((payload) => {
    response.body = payload;
    return response;
  });

  response.send = vi.fn((payload) => {
    response.body = payload;
    return response;
  });

  response.end = vi.fn(() => response);

  return response;
}

export function makeNext() {
  return vi.fn();
}

export function makeAuthHeaders(token) {
  return {
    authorization: `Bearer ${token}`,
  };
}
