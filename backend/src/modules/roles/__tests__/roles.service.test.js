import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAuthor, makeAdmin, makeUser } from '../../../test/fixtures/users.js';
import { makePost } from '../../../test/fixtures/posts.js';

async function loadBuildRolesService() {
  const module = await import('../roles.service.js');
  return module.buildRolesService;
}

describe('buildRolesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('denies USER for author-only actions', async () => {
    const buildRolesService = await loadBuildRolesService();
    const rolesService = buildRolesService();

    expect(rolesService.canCreatePost(makeUser())).toBe(false);
    expect(rolesService.hasRequiredRole(makeUser(), ['AUTHOR'])).toBe(false);
  });

  it('allows AUTHOR for author routes and author create actions', async () => {
    const buildRolesService = await loadBuildRolesService();
    const rolesService = buildRolesService();

    expect(rolesService.canCreatePost(makeAuthor())).toBe(true);
    expect(rolesService.hasRequiredRole(makeAuthor(), ['AUTHOR'])).toBe(true);
  });

  it('allows ADMIN for admin and author/global routes', async () => {
    const buildRolesService = await loadBuildRolesService();
    const rolesService = buildRolesService();
    const admin = makeAdmin();

    expect(rolesService.canCreatePost(admin)).toBe(true);
    expect(rolesService.hasRequiredRole(admin, ['AUTHOR'])).toBe(true);
    expect(rolesService.hasRequiredRole(admin, ['ADMIN'])).toBe(true);
  });

  it('enforces author ownership for post management', async () => {
    const buildRolesService = await loadBuildRolesService();
    const rolesService = buildRolesService();
    const actor = makeAuthor();
    const ownPost = makePost({ author_id: actor.id });
    const otherPost = makePost({
      author_id: '77777777-7777-7777-7777-777777777777',
    });

    expect(rolesService.canManagePost(actor, ownPost)).toBe(true);
    expect(rolesService.canManagePost(actor, otherPost)).toBe(false);
  });

  it('gives ADMIN override for post management', async () => {
    const buildRolesService = await loadBuildRolesService();
    const rolesService = buildRolesService();
    const admin = makeAdmin();
    const foreignPost = makePost({
      author_id: '88888888-8888-8888-8888-888888888888',
    });

    expect(rolesService.canManagePost(admin, foreignPost)).toBe(true);
  });
});
