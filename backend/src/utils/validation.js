import { z } from 'zod';

import { validation } from './errors.js';

export function mapZodIssues(issues) {
  return issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
}

export function validateSchema(schema, input, message = 'Validation failed') {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    throw validation(message, mapZodIssues(parsed.error.issues));
  }

  return parsed.data;
}

export { z };
