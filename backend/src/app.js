import express from 'express';

import { buildAuthController } from './modules/auth/auth.controller.js';
import { buildAuthRouter } from './modules/auth/auth.routes.js';
import { buildAuthService } from './modules/auth/auth.service.js';
import { buildPostsController } from './modules/posts/posts.controller.js';
import {
  buildDashboardPostsRouter,
  buildPublicPostsRouter,
} from './modules/posts/posts.routes.js';
import { buildPostsService } from './modules/posts/posts.service.js';
import { buildRolesService } from './modules/roles/roles.service.js';
import { buildUsersController } from './modules/users/users.controller.js';
import { buildUsersRepository } from './modules/users/users.repository.js';
import { buildUsersRouter } from './modules/users/users.routes.js';
import { buildUsersService } from './modules/users/users.service.js';
import { buildPostsRepository } from './modules/posts/posts.repository.js';
import { buildAuthMiddleware } from './middleware/auth.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { buildRoleMiddleware } from './middleware/role.middleware.js';
import { errorFactory } from './utils/errors.js';
import { buildSlugService } from './utils/slug.js';

export function buildApp() {
  const app = express();
  const usersRepository = buildUsersRepository();
  const postsRepository = buildPostsRepository();
  const rolesService = buildRolesService();
  const slugService = buildSlugService({ postsRepository });

  const authService = buildAuthService({
    userRepository: usersRepository,
  });

  const usersService = buildUsersService({
    userRepository: usersRepository,
  });

  const postsService = buildPostsService({
    postsRepository,
    rolesService,
    slugService,
  });

  const authController = buildAuthController({ authService });
  const usersController = buildUsersController({ usersService });
  const postsController = buildPostsController({ postsService });

  const authMiddleware = buildAuthMiddleware();
  const requireRoles = buildRoleMiddleware({ rolesService });

  app.use(express.json());

  app.use('/auth', buildAuthRouter({ authController, authMiddleware }));
  app.use('/users', buildUsersRouter({ usersController, authMiddleware }));
  app.use('/posts', buildPublicPostsRouter({ postsController }));
  app.use(
    '/dashboard/posts',
    buildDashboardPostsRouter({
      postsController,
      authMiddleware,
      requireRoles,
    }),
  );

  app.use((req, res, next) => {
    next(errorFactory.notFound('Route not found'));
  });

  app.use(errorMiddleware);

  return app;
}
