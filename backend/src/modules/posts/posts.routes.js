import { Router } from 'express';

export function buildPublicPostsRouter({ postsController }) {
  const router = Router();

  router.get('/', postsController.listPublic);
  router.get('/:slug', postsController.getPublicBySlug);

  return router;
}

export function buildDashboardPostsRouter({
  postsController,
  authMiddleware,
  requireRoles,
}) {
  const router = Router();
  const requireAuthorAccess = requireRoles(['AUTHOR']);

  router.use(authMiddleware);
  router.use(requireAuthorAccess);

  router.post('/', postsController.create);
  router.put('/:id', postsController.update);
  router.delete('/:id', postsController.delete);
  router.patch('/:id/publish', postsController.publish);
  router.patch('/:id/archive', postsController.archive);

  return router;
}
