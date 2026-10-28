import { validateSchema, z } from '../../utils/validation.js';

const createPostSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  summary: z.string().trim().min(1, 'Summary is required'),
  content: z.string().trim().min(1, 'Content is required'),
});

const updatePostSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  summary: z.string().trim().min(1, 'Summary is required'),
  content: z.string().trim().min(1, 'Content is required'),
});

export const postsValidators = {
  validateCreatePost(input) {
    return validateSchema(createPostSchema, input, 'Invalid post payload');
  },

  validateUpdatePost(input) {
    return validateSchema(updatePostSchema, input, 'Invalid post payload');
  },
};
