import { query } from '../../config/db.js';

const POST_COLUMNS = `
  id,
  title,
  slug,
  summary,
  content,
  status,
  author_id,
  published_at,
  created_at,
  updated_at
`;

function mapPostRow(row) {
  return row ?? null;
}

function buildUpdateStatement(data) {
  const allowedFields = [
    'title',
    'slug',
    'summary',
    'content',
    'status',
    'author_id',
    'published_at',
  ];

  const values = [];
  const setClauses = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      values.push(data[field]);
      setClauses.push(`${field} = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    return null;
  }

  setClauses.push('updated_at = NOW()');

  return {
    values,
    sql: `UPDATE posts SET ${setClauses.join(', ')} WHERE id = $${values.length + 1} RETURNING ${POST_COLUMNS}`,
  };
}

export function buildPostsRepository({ db } = {}) {
  const executor = db ?? { query };

  return {
    async listPublic() {
      const result = await executor.query(
        `
          SELECT ${POST_COLUMNS}
          FROM posts
          WHERE status = 'PUBLISHED'
          ORDER BY published_at DESC NULLS LAST, created_at DESC
        `,
      );

      return result.rows.map(mapPostRow);
    },

    async findBySlug(slug) {
      const result = await executor.query(
        `
          SELECT ${POST_COLUMNS}
          FROM posts
          WHERE slug = $1
          LIMIT 1
        `,
        [slug],
      );

      return mapPostRow(result.rows[0]);
    },

    async findById(id) {
      const result = await executor.query(
        `
          SELECT ${POST_COLUMNS}
          FROM posts
          WHERE id = $1
          LIMIT 1
        `,
        [id],
      );

      return mapPostRow(result.rows[0]);
    },

    async slugExists(slug, options = {}) {
      const { excludePostId } = options;

      if (excludePostId) {
        const result = await executor.query(
          `
            SELECT 1
            FROM posts
            WHERE slug = $1
              AND id <> $2
            LIMIT 1
          `,
          [slug, excludePostId],
        );

        return result.rowCount > 0;
      }

      const result = await executor.query(
        `
          SELECT 1
          FROM posts
          WHERE slug = $1
          LIMIT 1
        `,
        [slug],
      );

      return result.rowCount > 0;
    },

    async create(postData) {
      const result = await executor.query(
        `
          INSERT INTO posts (
            title,
            slug,
            summary,
            content,
            status,
            author_id,
            published_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING ${POST_COLUMNS}
        `,
        [
          postData.title,
          postData.slug,
          postData.summary,
          postData.content,
          postData.status,
          postData.author_id,
          postData.published_at,
        ],
      );

      return mapPostRow(result.rows[0]);
    },

    async update(id, postData) {
      const statement = buildUpdateStatement(postData);

      if (!statement) {
        return this.findById(id);
      }

      const result = await executor.query(statement.sql, [...statement.values, id]);
      return mapPostRow(result.rows[0]);
    },

    async remove(id) {
      await executor.query('DELETE FROM posts WHERE id = $1', [id]);
    },
  };
}
