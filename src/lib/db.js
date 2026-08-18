import pg from 'pg';
import { config } from './config.js';
import { assertDatabaseIdentity } from './database-identity.js';

// Railway provides DATABASE_URL; enable SSL in production.
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.isDeployed ? { rejectUnauthorized: false } : false,
  max: 10,
});

// Test-only injection. When set (by the behavioural test harness), query/tx route through the
// provided adapter instead of the real pool. Production never sets this, so behaviour is
// unchanged in the app. The adapter must expose query(text,params) and tx(fn).
let __testDb = null;
export function __setTestDb(adapter) { __testDb = adapter; }

export const query = (text, params) =>
  (__testDb ? __testDb.query(text, params) : pool.query(text, params));

// A deployed BTC process must prove the database-resident marker before it
// starts serving traffic. Local BTC with an explicitly configured database is
// checked too; an unconfigured local UI/test process remains possible.
export async function verifyRuntimeDatabaseIdentity(queryable = pool) {
  if (!config.databaseConfigured) return Object.freeze({ skipped: true });
  return assertDatabaseIdentity(queryable, config.databaseBoundaryId);
}

// Run a function inside a transaction; auto rollback on throw.
export async function tx(fn) {
  if (__testDb) return __testDb.tx(fn);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
