import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { query, closePool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const migrationPath = path.join(__dirname, 'migrations', '001_init.sql');
  const sql = await readFile(migrationPath, 'utf8');

  await query(sql);
  console.log('Database migration completed.');
}

run()
  .catch((error) => {
    console.error('Database migration failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
