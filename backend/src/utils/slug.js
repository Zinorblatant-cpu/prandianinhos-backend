function normalizeToSlug(title) {
  return String(title)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function slugifyTitle(title) {
  const slug = normalizeToSlug(title);
  return slug || 'post';
}

export function buildSlugService({ postsRepository } = {}) {
  if (!postsRepository) {
    throw new Error('buildSlugService requires postsRepository');
  }

  return {
    async generateUnique(title, options = {}) {
      const baseSlug = slugifyTitle(title);
      let candidate = baseSlug;
      let counter = 2;

      while (await postsRepository.slugExists(candidate, options)) {
        candidate = `${baseSlug}-${counter}`;
        counter += 1;
      }

      return candidate;
    },
  };
}
