import { closePool, withTransaction } from '../../config/db.js';
import { getEnv } from '../../config/env.js';
import { hashPassword } from '../../utils/hash.js';

async function ensureRoles(client) {
  await client.query(
    `
      INSERT INTO roles (name)
      VALUES ('USER'), ('AUTHOR'), ('ADMIN')
      ON CONFLICT (name) DO NOTHING
    `,
  );
}

async function upsertAuthor(client, { name, email, passwordHash }) {
  const userResult = await client.query(
    `
      INSERT INTO users (name, email, password_hash, is_active)
      VALUES ($1, $2, $3, TRUE)
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        is_active = TRUE,
        updated_at = NOW()
      RETURNING id
    `,
    [name, email, passwordHash],
  );

  const userId = userResult.rows[0].id;

  await client.query(
    `
      INSERT INTO user_roles (user_id, role_id)
      SELECT $1, r.id
      FROM roles r
      WHERE r.name = ANY($2::varchar[])
      ON CONFLICT DO NOTHING
    `,
    [userId, ['USER', 'AUTHOR']],
  );
}

async function run() {
  const env = getEnv();

  if (!env.SEED_AUTHOR_PASSWORD) {
    throw new Error('SEED_AUTHOR_PASSWORD must be defined to run the seed script');
  }

  const passwordHash = await hashPassword(env.SEED_AUTHOR_PASSWORD);

  await withTransaction(async (client) => {
    await ensureRoles(client);

    await upsertAuthor(client, {
      name: 'Author One',
      email: 'author1@example.com',
      passwordHash,
    });

    await upsertAuthor(client, {
      name: 'Author Two',
      email: 'author2@example.com',
      passwordHash,
    });
  });

  console.log('Seed completed: roles created and two author users ensured.');
}

run()
  .catch((error) => {
    console.error('Seed failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
