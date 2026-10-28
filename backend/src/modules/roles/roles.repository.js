import { query } from '../../config/db.js';

export function buildRolesRepository({ db } = {}) {
  const executor = db ?? { query };

  return {
    async list() {
      const result = await executor.query(
        `
          SELECT id, name
          FROM roles
          ORDER BY name ASC
        `,
      );

      return result.rows;
    },

    async findByName(name) {
      const result = await executor.query(
        `
          SELECT id, name
          FROM roles
          WHERE name = $1
          LIMIT 1
        `,
        [name],
      );

      return result.rows[0] ?? null;
    },

    async findByNames(names) {
      const result = await executor.query(
        `
          SELECT id, name
          FROM roles
          WHERE name = ANY($1::varchar[])
          ORDER BY name ASC
        `,
        [names],
      );

      return result.rows;
    },
  };
}
