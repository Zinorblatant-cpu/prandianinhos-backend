import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAuthor, makeAdmin, makeUser } from '../../../test/fixtures/users.js';
import {
  makeArchivedPost,
  makeCreatePostInput,
  makePost,
  makePublishedPost,
  makeUpdatePostInput,
} from '../../../test/fixtures/posts.js';
import {
  makeForbiddenError,
  makeNotFoundError,
  makeValidationError,
} from '../../../test/helpers/errors.js';

async function loadBuildPostsService() {
  const module = await import('../posts.service.js');
  return module.buildPostsService;
}

function createDependencies() {
  return {
    postsRepository: {
      listPublic: vi.fn(),
      findBySlug: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    rolesService: {
      canCreatePost: vi.fn(),
      canManagePost: vi.fn(),
    },
    slugService: {
      generateUnique: vi.fn(),
    },
    validators: {
      validateCreatePost: vi.fn((input) => input),
      validateUpdatePost: vi.fn((input) => input),
    },
    errors: {
      forbidden: vi.fn((message) => makeForbiddenError(message)),
      notFound: vi.fn((message) => makeNotFoundError(message)),
      validation: vi.fn((message, details) => makeValidationError(message, details)),
    },
  };
}

describe('buildPostsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('public listing returns only published posts', async () => {
    const buildPostsService = await loadBuildPostsService();
    const deps = createDependencies();
    const published = makePublishedPost();
    const draft = makePost();
    const archived = makeArchivedPost();

    deps.postsRepository.listPublic.mockResolvedValue([published, draft, archived]);

    const postsService = buildPostsService(deps);
    const result = await postsService.listPublicPosts();

    expect(deps.postsRepository.listPublic).toHaveBeenCalled();
    expect(result).toEqual([published]);
  });

  it('public fetch by slug returns a published post', async () => {
    const buildPostsService = await loadBuildPostsService();
    const deps = createDependencies();
    const published = makePublishedPost();

    deps.postsRepository.findBySlug.mockResolvedValue(published);

    const postsService = buildPostsService(deps);
    const result = await postsService.getPublicPostBySlug(published.slug);

    expect(deps.postsRepository.findBySlug).toHaveBeenCalledWith(published.slug);
    expect(result).toEqual(published);
  });

  it('slug lookup rejects when the slug does not exist', async () => {
    const buildPostsService = await loadBuildPostsService();
    const deps = createDependencies();

    deps.postsRepository.findBySlug.mockResolvedValue(null);

    const postsService = buildPostsService(deps);

    await expect(postsService.getPublicPostBySlug('missing-slug')).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(deps.errors.notFound).toHaveBeenCalled();
  });

  it.each([
    ['DRAFT', makePost()],
    ['ARCHIVED', makeArchivedPost()],
  ])('hides %s posts from public endpoints', async (_status, hiddenPost) => {
    const buildPostsService = await loadBuildPostsService();
    const deps = createDependencies();

    deps.postsRepository.findBySlug.mockResolvedValue(hiddenPost);

    const postsService = buildPostsService(deps);

    await expect(postsService.getPublicPostBySlug(hiddenPost.slug)).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(deps.errors.notFound).toHaveBeenCalled();
  });

  it('creates a post as AUTHOR', async () => {
    const buildPostsService = await loadBuildPostsService();
    const deps = createDependencies();
    const actor = makeAuthor();
    const input = makeCreatePostInput();
    const createdPost = makePost({
      author_id: actor.id,
      slug: 'how-to-learn-nodejs',
    });

    deps.rolesService.canCreatePost.mockReturnValue(true);
    deps.slugService.generateUnique.mockResolvedValue('how-to-learn-nodejs');
    deps.postsRepository.create.mockResolvedValue(createdPost);

    const postsService = buildPostsService(deps);
    const result = await postsService.createPost(actor, input);

    expect(deps.validators.validateCreatePost).toHaveBeenCalledWith(input);
    expect(deps.rolesService.canCreatePost).toHaveBeenCalledWith(actor);
    expect(deps.slugService.generateUnique).toHaveBeenCalledWith(input.title);
    expect(deps.postsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...input,
        author_id: actor.id,
        slug: 'how-to-learn-nodejs',
        status: 'DRAFT',
        published_at: null,
      }),
    );
    expect(result).toEqual(createdPost);
  });

  it('creates a post as ADMIN', async () => {
    const buildPostsService = await loadBuildPostsService();
    const deps = createDependencies();
    const actor = makeAdmin();
    const input = makeCreatePostInput();
    const createdPost = makePost({
      author_id: actor.id,
      slug: 'how-to-learn-nodejs',
    });

    deps.rolesService.canCreatePost.mockReturnValue(true);
    deps.slugService.generateUnique.mockResolvedValue('how-to-learn-nodejs');
    deps.postsRepository.create.mockResolvedValue(createdPost);

    const postsService = buildPostsService(deps);
    const result = await postsService.createPost(actor, input);

    expect(deps.rolesService.canCreatePost).toHaveBeenCalledWith(actor);
    expect(result).toEqual(createdPost);
  });

  it('rejects post creation for USER role', async () => {
    const buildPostsService = await loadBuildPostsService();
    const deps = createDependencies();
    const actor = makeUser();
    const input = makeCreatePostInput();

    deps.rolesService.canCreatePost.mockReturnValue(false);

    const postsService = buildPostsService(deps);

    await expect(postsService.createPost(actor, input)).rejects.toMatchObject({
      statusCode: 403,
    });

    expect(deps.errors.forbidden).toHaveBeenCalled();
    expect(deps.postsRepository.create).not.toHaveBeenCalled();
  });

  it('updates an author-owned post as AUTHOR', async () => {
    const buildPostsService = await loadBuildPostsService();
    const deps = createDependencies();
    const actor = makeAuthor();
    const existingPost = makePost({ author_id: actor.id });
    const input = makeUpdatePostInput();
    const updatedPost = {
      ...existingPost,
      ...input,
      slug: 'how-to-learn-express',
    };

    deps.postsRepository.findById.mockResolvedValue(existingPost);
    deps.rolesService.canManagePost.mockReturnValue(true);
    deps.slugService.generateUnique.mockResolvedValue('how-to-learn-express');
    deps.postsRepository.update.mockResolvedValue(updatedPost);

    const postsService = buildPostsService(deps);
    const result = await postsService.updatePost(actor, existingPost.id, input);

    expect(deps.validators.validateUpdatePost).toHaveBeenCalledWith(input);
    expect(deps.postsRepository.findById).toHaveBeenCalledWith(existingPost.id);
    expect(deps.rolesService.canManagePost).toHaveBeenCalledWith(actor, existingPost);
    expect(deps.slugService.generateUnique).toHaveBeenCalledWith(input.title, {
      excludePostId: existingPost.id,
    });
    expect(deps.postsRepository.update).toHaveBeenCalledWith(
      existingPost.id,
      expect.objectContaining({
        ...input,
        slug: 'how-to-learn-express',
      }),
    );
    expect(result).toEqual(updatedPost);
  });

  it('rejects updating another author post when the actor is not ADMIN', async () => {
    const buildPostsService = await loadBuildPostsService();
    const deps = createDependencies();
    const actor = makeAuthor();
    const foreignPost = makePost({
      author_id: '44444444-4444-4444-4444-444444444444',
    });

    deps.postsRepository.findById.mockResolvedValue(foreignPost);
    deps.rolesService.canManagePost.mockReturnValue(false);

    const postsService = buildPostsService(deps);

    await expect(
      postsService.updatePost(actor, foreignPost.id, makeUpdatePostInput()),
    ).rejects.toMatchObject({
      statusCode: 403,
    });

    expect(deps.errors.forbidden).toHaveBeenCalled();
    expect(deps.postsRepository.update).not.toHaveBeenCalled();
  });

  it('updates any post as ADMIN', async () => {
    const buildPostsService = await loadBuildPostsService();
    const deps = createDependencies();
    const actor = makeAdmin();
    const foreignPost = makePost({
      author_id: '55555555-5555-5555-5555-555555555555',
    });
    const input = makeUpdatePostInput();
    const updatedPost = {
      ...foreignPost,
      ...input,
      slug: 'how-to-learn-express',
    };

    deps.postsRepository.findById.mockResolvedValue(foreignPost);
    deps.rolesService.canManagePost.mockReturnValue(true);
    deps.slugService.generateUnique.mockResolvedValue('how-to-learn-express');
    deps.postsRepository.update.mockResolvedValue(updatedPost);

    const postsService = buildPostsService(deps);
    const result = await postsService.updatePost(actor, foreignPost.id, input);

    expect(deps.rolesService.canManagePost).toHaveBeenCalledWith(actor, foreignPost);
    expect(result).toEqual(updatedPost);
  });

  it('deletes an author-owned post as AUTHOR', async () => {
    const buildPostsService = await loadBuildPostsService();
    const deps = createDependencies();
    const actor = makeAuthor();
    const ownedPost = makePost({ author_id: actor.id });

    deps.postsRepository.findById.mockResolvedValue(ownedPost);
    deps.rolesService.canManagePost.mockReturnValue(true);
    deps.postsRepository.remove.mockResolvedValue(undefined);

    const postsService = buildPostsService(deps);
    await postsService.deletePost(actor, ownedPost.id);

    expect(deps.postsRepository.findById).toHaveBeenCalledWith(ownedPost.id);
    expect(deps.rolesService.canManagePost).toHaveBeenCalledWith(actor, ownedPost);
    expect(deps.postsRepository.remove).toHaveBeenCalledWith(ownedPost.id);
  });

  it('rejects deleting another author post when the actor is not ADMIN', async () => {
    const buildPostsService = await loadBuildPostsService();
    const deps = createDependencies();
    const actor = makeAuthor();
    const foreignPost = makePost({
      author_id: '66666666-6666-6666-6666-666666666666',
    });

    deps.postsRepository.findById.mockResolvedValue(foreignPost);
    deps.rolesService.canManagePost.mockReturnValue(false);

    const postsService = buildPostsService(deps);

    await expect(postsService.deletePost(actor, foreignPost.id)).rejects.toMatchObject({
      statusCode: 403,
    });

    expect(deps.errors.forbidden).toHaveBeenCalled();
    expect(deps.postsRepository.remove).not.toHaveBeenCalled();
  });

  it('publishes a post with proper authorization', async () => {
    const buildPostsService = await loadBuildPostsService();
    const deps = createDependencies();
    const actor = makeAuthor();
    const ownedPost = makePost({ author_id: actor.id });
    const publishedPost = makePublishedPost({
      id: ownedPost.id,
      author_id: actor.id,
      slug: ownedPost.slug,
      title: ownedPost.title,
      summary: ownedPost.summary,
      content: ownedPost.content,
    });

    deps.postsRepository.findById.mockResolvedValue(ownedPost);
    deps.rolesService.canManagePost.mockReturnValue(true);
    deps.postsRepository.update.mockResolvedValue(publishedPost);

    const postsService = buildPostsService(deps);
    const result = await postsService.publishPost(actor, ownedPost.id);

    expect(deps.postsRepository.update).toHaveBeenCalledWith(
      ownedPost.id,
      expect.objectContaining({
        status: 'PUBLISHED',
        published_at: expect.any(Date),
      }),
    );
    expect(result).toEqual(publishedPost);
  });

  it('archives a post with proper authorization', async () => {
    const buildPostsService = await loadBuildPostsService();
    const deps = createDependencies();
    const actor = makeAdmin();
    const post = makePublishedPost();
    const archivedPost = makeArchivedPost({
      id: post.id,
      author_id: post.author_id,
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      content: post.content,
    });

    deps.postsRepository.findById.mockResolvedValue(post);
    deps.rolesService.canManagePost.mockReturnValue(true);
    deps.postsRepository.update.mockResolvedValue(archivedPost);

    const postsService = buildPostsService(deps);
    const result = await postsService.archivePost(actor, post.id);

    expect(deps.postsRepository.update).toHaveBeenCalledWith(
      post.id,
      expect.objectContaining({
        status: 'ARCHIVED',
        published_at: null,
      }),
    );
    expect(result).toEqual(archivedPost);
  });

  it('fails validation before touching persistence on invalid create payloads', async () => {
    const buildPostsService = await loadBuildPostsService();
    const deps = createDependencies();
    const actor = makeAuthor();
    const invalidInput = makeCreatePostInput({ title: '' });

    deps.validators.validateCreatePost.mockImplementation(() => {
      throw makeValidationError('Title is required', [
        { field: 'title', message: 'Required' },
      ]);
    });

    const postsService = buildPostsService(deps);

    await expect(postsService.createPost(actor, invalidInput)).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(deps.slugService.generateUnique).not.toHaveBeenCalled();
    expect(deps.postsRepository.create).not.toHaveBeenCalled();
  });
});
