import { query, withTransaction } from '../../config/db.js';

const USER_SELECT = `
  SELECT
    u.id,
    u.name,
    u.email,
    u.password_hash,
    u.is_active,
    u.created_at,
    u.updated_at,
    COALESCE(
      array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL),
      ARRAY[]::varchar[]
    ) AS roles
  FROM users u
  LEFT JOIN user_roles ur ON ur.user_id = u.id
  LEFT JOIN roles r ON r.id = ur.role_id
`;

const USER_GROUP_BY = `
  GROUP BY
    u.id,
    u.name,
    u.email,
    u.password_hash,
    u.is_active,
    u.created_at,
    u.updated_at
`;

function mapUserRow(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    roles: Array.isArray(row.roles) ? row.roles : [],
  };
}

async function fetchUserByClause(executor, clause, values) {
  const result = await executor.query(
    `
      ${USER_SELECT}
      ${clause}
      ${USER_GROUP_BY}
    `,
    values,
  );

  return mapUserRow(result.rows[0]);
}

export function buildUsersRepository({ db } = {}) {
  const executor = db ?? { query, withTransaction };

  return {
    async findByEmail(email) {
      return fetchUserByClause(executor, 'WHERE u.email = $1', [email]);
    },

    async findById(id) {
      return fetchUserByClause(executor, 'WHERE u.id = $1', [id]);
    },

    async create(userData) {
      const roles = Array.isArray(userData.roles) && userData.roles.length > 0
        ? userData.roles
        : ['USER'];

      return executor.withTransaction(async (client) => {
        const insertUserResult = await client.query(
          `
            INSERT INTO users (
              name,
              email,
              password_hash,
              is_active
            )
            VALUES ($1, $2, $3, $4)
            RETURNING id
          `,
          [
            userData.name,
            userData.email,
            userData.password_hash,
            userData.is_active ?? true,
          ],
        );

        const userId = insertUserResult.rows[0].id;

        await client.query(
          `
            INSERT INTO user_roles (user_id, role_id)
            SELECT $1, r.id
            FROM roles r
            WHERE r.name = ANY($2::varchar[])
            ON CONFLICT DO NOTHING
          `,
          [userId, roles],
        );

        return fetchUserByClause(client, 'WHERE u.id = $1', [userId]);
      });
    },
  };
}
