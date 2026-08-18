#!/usr/bin/env node
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';

const expected = [
  'DELETE /api/v1/me',
  'GET /*',
  'GET /api/v1/consent',
  'GET /api/v1/content/bootstrap',
  'GET /api/v1/content/scene/:ck',
  'GET /api/v1/content/scene/:ck/level/:level',
  'GET /api/v1/content/topic/:key',
  'GET /api/v1/insights/feed',
  'GET /api/v1/insights/mine',
  'GET /api/v1/me',
  'GET /api/v1/me/stats',
  'GET /api/v1/progress',
  'GET /api/v1/quiz',
  'GET /api/v1/quiz/catalog',
  'GET /atlas',
  'GET /atlas/',
  'GET /health',
  'GET /robots.txt',
  'GET /runtime-config.js',
  'GET /v62.html',
  'HEAD /*',
  'HEAD /api/v1/consent',
  'HEAD /api/v1/content/bootstrap',
  'HEAD /api/v1/content/scene/:ck',
  'HEAD /api/v1/content/scene/:ck/level/:level',
  'HEAD /api/v1/content/topic/:key',
  'HEAD /api/v1/insights/feed',
  'HEAD /api/v1/insights/mine',
  'HEAD /api/v1/me',
  'HEAD /api/v1/me/stats',
  'HEAD /api/v1/progress',
  'HEAD /api/v1/quiz',
  'HEAD /api/v1/quiz/catalog',
  'HEAD /atlas',
  'HEAD /atlas/',
  'HEAD /health',
  'HEAD /robots.txt',
  'HEAD /runtime-config.js',
  'HEAD /v62.html',
  'OPTIONS *',
  'PATCH /api/v1/insights/:id',
  'PATCH /api/v1/me',
  'POST /api/v1/auth/logout',
  'POST /api/v1/auth/logout-all',
  'POST /api/v1/auth/refresh',
  'POST /api/v1/auth/telegram',
  'POST /api/v1/auth/telegram-widget',
  'POST /api/v1/consent/extend',
  'POST /api/v1/insights',
  'POST /api/v1/me/heartbeat',
  'POST /api/v1/progress',
  'POST /api/v1/progress/visit',
  'POST /api/v1/quiz/answer',
].sort();

const inventory = [];
const app = await buildApp({
  logger: false,
  onRoute(route) {
    const methods = Array.isArray(route.method) ? route.method : [route.method];
    for (const method of methods) inventory.push(`${String(method).toUpperCase()} ${route.url}`);
  },
});
await app.ready();
assert.deepEqual([...new Set(inventory)].sort(), expected, 'exact BTC route inventory');

// The exact allowlist above is the negative boundary: any non-listed route is absent.
assert.equal((await app.inject({ method: 'GET', url: '/health' })).statusCode, 200);
assert.equal((await app.inject({ method: 'GET', url: '/atlas' })).statusCode, 200);
await app.close();
console.log(`Public BTC runtime: OK — ${expected.length} exact routes`);
