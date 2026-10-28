import { Router } from 'express';

export function buildUsersRouter({ usersController, authMiddleware }) {
  const router = Router();

  router.get('/me', authMiddleware, usersController.getProfile);

  return router;
}
