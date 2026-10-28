export function buildPostsController(deps = {}) {
  const { postsService } = deps;

  return {
    async listPublic(req, res, next) {
      try {
        const posts = await postsService.listPublicPosts();
        res.status(200).json({ posts });
      } catch (error) {
        next(error);
      }
    },

    async getPublicBySlug(req, res, next) {
      try {
        const post = await postsService.getPublicPostBySlug(req.params.slug);
        res.status(200).json({ post });
      } catch (error) {
        next(error);
      }
    },

    async create(req, res, next) {
      try {
        const post = await postsService.createPost(req.user, req.body);
        res.status(201).json({ post });
      } catch (error) {
        next(error);
      }
    },

    async update(req, res, next) {
      try {
        const post = await postsService.updatePost(req.user, req.params.id, req.body);
        res.status(200).json({ post });
      } catch (error) {
        next(error);
      }
    },

    async delete(req, res, next) {
      try {
        await postsService.deletePost(req.user, req.params.id);
        res.status(204).end();
      } catch (error) {
        next(error);
      }
    },

    async publish(req, res, next) {
      try {
        const post = await postsService.publishPost(req.user, req.params.id);
        res.status(200).json({ post });
      } catch (error) {
        next(error);
      }
    },

    async archive(req, res, next) {
      try {
        const post = await postsService.archivePost(req.user, req.params.id);
        res.status(200).json({ post });
      } catch (error) {
        next(error);
      }
    },
  };
}
