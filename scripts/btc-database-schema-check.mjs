#!/usr/bin/env node
// Issue #91 / 91B — executable BTC schema, marker and privilege evidence.

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { assertDatabaseIdentity, readDatabaseIdentity } from '../src/lib/database-identity.js';

const ROOT = new URL('..', import.meta.url).pathname;
const MIGRATIONS = join(ROOT, 'migrations', 'btc');
let checks = 0;
const eq = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks += 1; };
const ok = (actual, message) => { assert.ok(actual, message); checks += 1; };
const rejects = async (fn, pattern, message) => {
  await assert.rejects(fn, pattern, message); checks += 1;
};

const db = new PGlite();
const q = { query: (sql, params = []) => db.query(sql, params) };
const adapter = {
  query: q.query,
  tx: async (fn) => {
    await db.exec('BEGIN');
    try {
      const value = await fn(q);
      await db.exec('COMMIT');
      return value;
    } catch (error) {
      await db.exec('ROLLBACK');
      throw error;
    }
  },
};

// 1. Missing and mismatched markers fail closed.
eq(await readDatabaseIdentity(q), null, 'an unprovisioned database has no identity');
await rejects(() => assertDatabaseIdentity(q, 'luminara_btc'), /marker is missing/,
  'missing marker is rejected');
await db.exec(`CREATE SCHEMA luminara_system;
  CREATE TABLE luminara_system.database_identity (
    identity_key TEXT PRIMARY KEY,
    boundary_id TEXT NOT NULL,
    initialized_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  INSERT INTO luminara_system.database_identity(identity_key,boundary_id)
  VALUES ('primary','unrelated_product');`);
await rejects(() => assertDatabaseIdentity(q, 'luminara_btc'), /identity mismatch/,
  'a non-BTC marker is rejected by BTC');
await db.query(`UPDATE luminara_system.database_identity SET boundary_id='luminara_btc'`);
eq((await assertDatabaseIdentity(q, 'luminara_btc')).boundaryId, 'luminara_btc',
  'the BTC marker is accepted');

// 2. Apply the real BTC migration files twice: append-only files are rerun-safe.
const files = readdirSync(MIGRATIONS).filter((name) => name.endsWith('.sql')).sort();
eq(files, ['001_core.sql', '002_learning.sql'],
  'the BTC migration inventory is explicit');
for (const pass of [1, 2]) {
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS, file), 'utf8')
      .replace(/CREATE EXTENSION[^;]*;/gi, '-- extension supplied by PGlite');
    await db.exec(sql);
  }
  ok(true, `BTC migrations pass ${pass} completed`);
}

const tables = (await db.query(
  `SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`,
)).rows.map((row) => row.table_name);
const REQUIRED = [
  'audit_log', 'auth_challenges', 'consents', 'identities', 'insights',
  'lesson_progress', 'lesson_scene_progress',
  'quiz_attempts', 'roles', 'sessions', 'user_activity', 'user_roles', 'users',
].sort();
eq(tables, REQUIRED, 'BTC contains exactly the approved user/auth/learning tables');
for (const forbidden of [
  'payment_plans', 'payment_invoices', 'payment_events', 'merchant_config',
  'points_log', 'mission_progress', 'referrals', 'referral_codes',
  'used_ton_nonces', 'used_wallet_nonces', 'subscriptions',
]) {
  eq(tables.includes(forbidden), false, `${forbidden} is absent from BTC`);
}

// 3. Behavioural proof through the real shared auth/session implementation.
// Module configuration is boot-owned and selected before these dynamic imports.
process.env.NODE_ENV = 'test';
process.env.SITE_PROFILE = 'luminara_btc';
process.env.DATABASE_URL = '';
process.env.BTC_DATABASE_URL = 'postgres://unused:unused@db.invalid:5432/luminara_btc';
const [{ __setTestDb }, authModule] = await Promise.all([
  import('../src/lib/db.js'),
  import('../src/lib/auth.js'),
]);
__setTestDb(adapter);
const user = await authModule.findOrCreateByIdentity({
  provider: 'telegram', externalId: 'synthetic-telegram',
  displayName: 'Synthetic BTC learner', locale: undefined, isSuperadmin: true,
});
const storedUser = (await db.query(
  `SELECT id,locale,activated_at FROM users WHERE id=$1`, [user.id],
)).rows[0];
eq(user.id, storedUser.id, 'real auth creates the user in the BTC database');
eq(storedUser.locale, 'en', 'new BTC accounts default to English');
ok(storedUser.activated_at, 'BTC account is active without a TON activation event');
const session = await authModule.createSession(user, {
  headers: { 'user-agent': 'synthetic-91b-check' },
  ip: '203.0.113.91',
});
ok(session.sessionId, 'real shared auth creates a BTC session');
const storedSession = (await db.query(
  `SELECT ip,device FROM sessions WHERE id=$1`, [session.sessionId],
)).rows[0];
eq(storedSession.ip, null, 'BTC session does not persist the supplied raw IP');
ok(String(storedSession.device).startsWith('ua:'), 'BTC retains only the bounded device hash');

// 4. Cascade deletion and audit preservation.
const userId = user.id;
await db.query(
  `INSERT INTO lesson_progress(user_id,topic,scene_idx,last_scene_idx)
   VALUES ($1,'bitcoin',1,1)`, [userId],
);
await db.query(
  `INSERT INTO lesson_scene_progress(user_id,topic,scene_key,scene_idx)
   VALUES ($1,'bitcoin','btc-1',1)`, [userId],
);
await db.query(
  `INSERT INTO quiz_attempts(user_id,question_id,topic_key,correct)
   VALUES ($1,'q-1','bitcoin',TRUE)`, [userId],
);
await db.query(
  `INSERT INTO audit_log(actor_id,actor_id_snapshot,action,target)
   VALUES ($1::uuid,$1::uuid,'account_delete',$1::text)`, [userId],
);
await db.query('DELETE FROM users WHERE id=$1', [userId]);
for (const table of ['identities', 'user_roles', 'sessions', 'lesson_progress', 'lesson_scene_progress', 'quiz_attempts']) {
  eq((await db.query(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n, 0,
    `${table} is removed with the BTC account`);
}
const audit = (await db.query('SELECT actor_id,actor_id_snapshot FROM audit_log')).rows[0];
eq(audit.actor_id, null, 'audit FK is anonymized on account deletion');
eq(audit.actor_id_snapshot, userId, 'audit attribution snapshot survives deletion');

// 5. SQL privilege denials under both synthetic runtime roles.
await db.exec(`
  CREATE ROLE unrelated_product_app;
  CREATE ROLE luminara_btc_app;
  CREATE SCHEMA unrelated_private;
  CREATE SCHEMA btc_private;
  CREATE TABLE unrelated_private.users(id INTEGER PRIMARY KEY);
  CREATE TABLE btc_private.users(id INTEGER PRIMARY KEY);
  INSERT INTO unrelated_private.users VALUES (1);
  INSERT INTO btc_private.users VALUES (2);
  REVOKE ALL ON SCHEMA unrelated_private, btc_private FROM PUBLIC;
  REVOKE ALL ON ALL TABLES IN SCHEMA unrelated_private, btc_private FROM PUBLIC;
  GRANT USAGE ON SCHEMA unrelated_private TO unrelated_product_app;
  GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA unrelated_private TO unrelated_product_app;
  GRANT USAGE ON SCHEMA btc_private TO luminara_btc_app;
  GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA btc_private TO luminara_btc_app;
`);
await db.exec('SET ROLE unrelated_product_app');
eq((await db.query('SELECT id FROM unrelated_private.users')).rows[0].id, 1,
  'unrelated runtime role can read its own data');
await rejects(() => db.query('SELECT * FROM btc_private.users'), /permission denied/,
  'unrelated runtime role cannot read BTC data');
await rejects(() => db.query('DELETE FROM btc_private.users'), /permission denied/,
  'unrelated runtime role cannot delete BTC data');
await db.exec('RESET ROLE; SET ROLE luminara_btc_app');
eq((await db.query('SELECT id FROM btc_private.users')).rows[0].id, 2,
  'BTC runtime role can read BTC data');
await rejects(() => db.query('SELECT * FROM unrelated_private.users'), /permission denied/,
  'BTC runtime role cannot read unrelated data');
await rejects(() => db.query('UPDATE unrelated_private.users SET id=3'), /permission denied/,
  'BTC runtime role cannot mutate unrelated data');
await db.exec('RESET ROLE');

// 6. Wiring: server checks before build/listen; migrator owns a separate ledger.
const server = readFileSync(join(ROOT, 'src', 'server.js'), 'utf8');
const migrate = readFileSync(join(ROOT, 'src', 'migrate.js'), 'utf8');
const auth = readFileSync(join(ROOT, 'src', 'lib', 'auth.js'), 'utf8');
ok(server.indexOf('verifyRuntimeDatabaseIdentity') < server.indexOf('buildApp()'),
  'server verifies database identity before building/listening');
ok(migrate.includes("'migrations', 'btc'"),
  'BTC migrator selects the dedicated directory');
ok(migrate.includes("'_luminara_btc_migrations'"),
  'BTC migrator uses a separate ledger');
eq(migrate.includes("join(__dirname, '..', 'migrations');"), false,
  'no alternate migration directory remains');
ok(auth.includes("VALUES ($1,$2,$3,$4,NULL,$5)"),
  'session writer stores no raw IP address');

await db.close();
console.log(`BTC database schema (#91 / 91B): OK — ${checks} assertions`);
