#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const checks = [
  'public-export-check.mjs',
  'btc-content-manifest-check.mjs',
  'btc-content-evidence-check.mjs',
  'btc-frontend-boundary-check.mjs',
  'btc-api-client-check.mjs',
  'btc-database-schema-check.mjs',
  'database-boundary-check.mjs',
];
for (const check of checks) {
  execFileSync(process.execPath, [new URL(check, import.meta.url).pathname], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' },
  });
}
console.log(`Luminara BTC QA: OK (${checks.length} checks)`);
