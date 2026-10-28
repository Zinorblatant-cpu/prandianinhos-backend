import { buildSlugService } from '../../utils/slug.js';
import {
  conflict as conflictError,
  errorFactory,
  isUniqueViolation,
} from '../../utils/errors.js';
import { buildRolesService } from '../roles/roles.service.js';
import { buildPostsRepository } from './posts.repository.js';
import { postsValidators } from './posts.validators.js';

function resolveConflictError(errors, message) {
  return typeof errors.conflict === 'function'
    ? errors.conflict(message)
    : conflictError(message);
}

export function buildPostsService(deps = {}) {
  const postsRepository = deps.postsRepository ?? buildPostsRepository();
  const rolesService = deps.rolesService ?? buildRolesService();
  const slugService = deps.slugService ?? buildSlugService({ postsRepository });
  const validators = deps.validators ?? postsValidators;
  const errors = deps.errors ?? errorFactory;

  async function getExistingPost(postId) {
    const post = await postsRepository.findById(postId);

    if (!post) {
      throw errors.notFound('Post not found');
    }

    return post;
  }

  async function assertManagePermission(actor, post) {
    if (!rolesService.canManagePost(actor, post)) {
      throw errors.forbidden('You do not have permission to manage this post');
    }
  }

  return {
    async listPublicPosts() {
      const posts = await postsRepository.listPublic();
      return posts.filter((post) => post.status === 'PUBLISHED');
    },

    async getPublicPostBySlug(slug) {
      const post = await postsRepository.findBySlug(slug);

      if (!post || post.status !== 'PUBLISHED') {
        throw errors.notFound('Post not found');
      }

      return post;
    },

    async createPost(actor, input) {
      const payload = validators.validateCreatePost(input);

      if (!rolesService.canCreatePost(actor)) {
        throw errors.forbidden('You do not have permission to create posts');
      }

      const slug = await slugService.generateUnique(payload.title);

      try {
        return await postsRepository.create({
          ...payload,
          slug,
          author_id: actor.id,
          status: 'DRAFT',
          published_at: null,
        });
      } catch (error) {
        if (isUniqueViolation(error, ['posts_slug_key'])) {
          throw resolveConflictError(errors, 'Post slug already exists');
        }

        throw error;
      }
    },

    async updatePost(actor, postId, input) {
      const payload = validators.validateUpdatePost(input);
      const existingPost = await getExistingPost(postId);

      await assertManagePermission(actor, existingPost);

      const slug = await slugService.generateUnique(payload.title, {
        excludePostId: postId,
      });

      try {
        return await postsRepository.update(postId, {
          ...payload,
          slug,
        });
      } catch (error) {
        if (isUniqueViolation(error, ['posts_slug_key'])) {
          throw resolveConflictError(errors, 'Post slug already exists');
        }

        throw error;
      }
    },

    async deletePost(actor, postId) {
      const existingPost = await getExistingPost(postId);
      await assertManagePermission(actor, existingPost);
      await postsRepository.remove(postId);
    },

    async publishPost(actor, postId) {
      const existingPost = await getExistingPost(postId);
      await assertManagePermission(actor, existingPost);

      return postsRepository.update(postId, {
        status: 'PUBLISHED',
        published_at: new Date(),
      });
    },

    async archivePost(actor, postId) {
      const existingPost = await getExistingPost(postId);
      await assertManagePermission(actor, existingPost);

      return postsRepository.update(postId, {
        status: 'ARCHIVED',
        published_at: null,
      });
    },
  };
}
