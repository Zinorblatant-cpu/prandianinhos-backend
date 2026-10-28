import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAuthor } from '../../../test/fixtures/users.js';
import {
  makeCreatePostInput,
  makePost,
  makePublishedPost,
  makeUpdatePostInput,
} from '../../../test/fixtures/posts.js';
import {
  makeNext,
  makeRequest,
  makeResponse,
} from '../../../test/helpers/http.js';

async function loadBuildPostsController() {
  const module = await import('../posts.controller.js');
  return module.buildPostsController;
}

function createDependencies() {
  return {
    postsService: {
      listPublicPosts: vi.fn(),
      getPublicPostBySlug: vi.fn(),
      createPost: vi.fn(),
      updatePost: vi.fn(),
      deletePost: vi.fn(),
      publishPost: vi.fn(),
      archivePost: vi.fn(),
    },
  };
}

describe('buildPostsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the public posts listing', async () => {
    const buildPostsController = await loadBuildPostsController();
    const deps = createDependencies();
    const publicPosts = [makePublishedPost()];

    deps.postsService.listPublicPosts.mockResolvedValue(publicPosts);

    const controller = buildPostsController(deps);
    const req = makeRequest();
    const res = makeResponse();
    const next = makeNext();

    await controller.listPublic(req, res, next);

    expect(deps.postsService.listPublicPosts).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ posts: publicPosts });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns a public post by slug', async () => {
    const buildPostsController = await loadBuildPostsController();
    const deps = createDependencies();
    const post = makePublishedPost();

    deps.postsService.getPublicPostBySlug.mockResolvedValue(post);

    const controller = buildPostsController(deps);
    const req = makeRequest({ params: { slug: post.slug } });
    const res = makeResponse();
    const next = makeNext();

    await controller.getPublicBySlug(req, res, next);

    expect(deps.postsService.getPublicPostBySlug).toHaveBeenCalledWith(post.slug);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ post });
    expect(next).not.toHaveBeenCalled();
  });

  it('creates a dashboard post for an authenticated actor', async () => {
    const buildPostsController = await loadBuildPostsController();
    const deps = createDependencies();
    const actor = makeAuthor();
    const input = makeCreatePostInput();
    const createdPost = makePost({ author_id: actor.id });

    deps.postsService.createPost.mockResolvedValue(createdPost);

    const controller = buildPostsController(deps);
    const req = makeRequest({ user: actor, body: input });
    const res = makeResponse();
    const next = makeNext();

    await controller.create(req, res, next);

    expect(deps.postsService.createPost).toHaveBeenCalledWith(actor, input);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ post: createdPost });
    expect(next).not.toHaveBeenCalled();
  });

  it('updates a dashboard post', async () => {
    const buildPostsController = await loadBuildPostsController();
    const deps = createDependencies();
    const actor = makeAuthor();
    const input = makeUpdatePostInput();
    const updatedPost = makePost({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      author_id: actor.id,
      ...input,
    });

    deps.postsService.updatePost.mockResolvedValue(updatedPost);

    const controller = buildPostsController(deps);
    const req = makeRequest({
      user: actor,
      params: { id: updatedPost.id },
      body: input,
    });
    const res = makeResponse();
    const next = makeNext();

    await controller.update(req, res, next);

    expect(deps.postsService.updatePost).toHaveBeenCalledWith(actor, updatedPost.id, input);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ post: updatedPost });
    expect(next).not.toHaveBeenCalled();
  });

  it('deletes a dashboard post', async () => {
    const buildPostsController = await loadBuildPostsController();
    const deps = createDependencies();
    const actor = makeAuthor();
    const post = makePost({ author_id: actor.id });

    deps.postsService.deletePost.mockResolvedValue(undefined);

    const controller = buildPostsController(deps);
    const req = makeRequest({
      user: actor,
      params: { id: post.id },
    });
    const res = makeResponse();
    const next = makeNext();

    await controller.delete(req, res, next);

    expect(deps.postsService.deletePost).toHaveBeenCalledWith(actor, post.id);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('publishes a dashboard post', async () => {
    const buildPostsController = await loadBuildPostsController();
    const deps = createDependencies();
    const actor = makeAuthor();
    const publishedPost = makePublishedPost({ author_id: actor.id });

    deps.postsService.publishPost.mockResolvedValue(publishedPost);

    const controller = buildPostsController(deps);
    const req = makeRequest({
      user: actor,
      params: { id: publishedPost.id },
    });
    const res = makeResponse();
    const next = makeNext();

    await controller.publish(req, res, next);

    expect(deps.postsService.publishPost).toHaveBeenCalledWith(actor, publishedPost.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ post: publishedPost });
    expect(next).not.toHaveBeenCalled();
  });

  it('archives a dashboard post', async () => {
    const buildPostsController = await loadBuildPostsController();
    const deps = createDependencies();
    const actor = makeAuthor();
    const archivedPost = makePost({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      author_id: actor.id,
      status: 'ARCHIVED',
    });

    deps.postsService.archivePost.mockResolvedValue(archivedPost);

    const controller = buildPostsController(deps);
    const req = makeRequest({
      user: actor,
      params: { id: archivedPost.id },
    });
    const res = makeResponse();
    const next = makeNext();

    await controller.archive(req, res, next);

    expect(deps.postsService.archivePost).toHaveBeenCalledWith(actor, archivedPost.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ post: archivedPost });
    expect(next).not.toHaveBeenCalled();
  });
});
