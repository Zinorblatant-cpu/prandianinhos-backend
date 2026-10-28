const ROLE_USER = 'USER';
const ROLE_AUTHOR = 'AUTHOR';
const ROLE_ADMIN = 'ADMIN';

function getRoles(user) {
  return Array.isArray(user?.roles) ? user.roles : [];
}

export function buildRolesService() {
  function hasRequiredRole(user, requiredRoles = []) {
    const roles = getRoles(user);

    if (requiredRoles.length === 0) {
      return true;
    }

    if (roles.includes(ROLE_ADMIN)) {
      return true;
    }

    return requiredRoles.some((role) => roles.includes(role));
  }

  function canCreatePost(user) {
    return hasRequiredRole(user, [ROLE_AUTHOR]);
  }

  function canManagePost(user, post) {
    const roles = getRoles(user);

    if (roles.includes(ROLE_ADMIN)) {
      return true;
    }

    return roles.includes(ROLE_AUTHOR) && user?.id === post?.author_id;
  }

  return {
    hasRequiredRole,
    canCreatePost,
    canManagePost,
  };
}

export const roles = {
  USER: ROLE_USER,
  AUTHOR: ROLE_AUTHOR,
  ADMIN: ROLE_ADMIN,
};
