import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool, verifyRuntimeDatabaseIdentity } from './lib/db.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations', 'btc');
const ledger = '_luminara_btc_migrations';

async function run() {
  await verifyRuntimeDatabaseIdentity(pool);
  await pool.query(`CREATE TABLE IF NOT EXISTS ${ledger} (
    name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  const applied = new Set(
    (await pool.query(`SELECT name FROM ${ledger}`)).rows.map((row) => row.name),
  );
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.sql')).sort()) {
    if (applied.has(file)) continue;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(readFileSync(join(dir, file), 'utf8'));
      await client.query(`INSERT INTO ${ledger}(name) VALUES ($1)`, [file]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  await pool.end();
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
