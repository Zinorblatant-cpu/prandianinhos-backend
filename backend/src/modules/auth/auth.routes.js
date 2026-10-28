import { Router } from 'express';

export function buildAuthRouter({ authController, authMiddleware }) {
  const router = Router();

  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.get('/me', authMiddleware, authController.me);

  return router;
}
