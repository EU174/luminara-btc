#!/usr/bin/env node
import assert from 'node:assert/strict';
import { resolveDatabaseBoundary } from '../src/lib/database-boundary.js';

const url = 'postgres://btc:synthetic@btc-db.invalid:5432/luminara_btc';
const deployed = resolveDatabaseBoundary({
  deployed: true,
  env: {
    BTC_DATABASE_URL: url,
    DATABASE_BOUNDARY_ID: 'luminara_btc',
  },
});
assert.equal(deployed.boundaryId, 'luminara_btc');
assert.equal(deployed.sourceEnv, 'BTC_DATABASE_URL');
assert.equal(deployed.connectionString, url);
assert.ok(Object.isFrozen(deployed));

for (const [env, pattern] of [
  [{ DATABASE_BOUNDARY_ID: 'luminara_btc' }, /BTC_DATABASE_URL is required/],
  [{ BTC_DATABASE_URL: url, DATABASE_URL: url, DATABASE_BOUNDARY_ID: 'luminara_btc' },
    /DATABASE_URL must be absent/],
  [{ BTC_DATABASE_URL: url, DATABASE_BOUNDARY_ID: 'other' }, /must equal luminara_btc/],
  [{ BTC_DATABASE_URL: 'https://example.invalid/db', DATABASE_BOUNDARY_ID: 'luminara_btc' },
    /PostgreSQL/],
]) {
  assert.throws(() => resolveDatabaseBoundary({ env, deployed: true }), pattern);
}
const local = resolveDatabaseBoundary({ env: {}, deployed: false });
assert.equal(local.configured, false);
assert.equal(local.connectionString, undefined);
console.log('BTC database boundary: OK');
