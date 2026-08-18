#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const calls = [];
const replies = [
  { token: 'memory-token' },
  { user: { first_name: 'Eugene' } },
  { byTopic: { 'bitcoin-atlas': { visited: 1 } } },
  { ok: true },
  { ok: true },
  { questions: [] },
  { ok: true },
  { insights: [] },
  { insight: { id: 'synthetic' } },
];
const context = {
  window: {},
  fetch: async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, text: async () => JSON.stringify(replies.shift()) };
  },
};
vm.createContext(context);
vm.runInContext(readFileSync(new URL('../src/public/v62/btc-api.js', import.meta.url), 'utf8'), context);

const api = context.window.LuminaraBtcApi;
await api.bootstrap();
await api.me();
await api.progress();
await api.visit('bitcoin-atlas', 1);
await api.complete('bitcoin-atlas', 8, 'synthetic-scene', 9);
await api.quiz('bitcoin-atlas');
await api.answer('synthetic-question', 'synthetic-option');
await api.insights();
await api.saveInsight('bitcoin-atlas', 'Synthetic insight');

assert.deepEqual(calls.map((call) => call.url), [
  '/api/v1/auth/refresh', '/api/v1/me', '/api/v1/progress', '/api/v1/progress/visit',
  '/api/v1/progress', '/api/v1/quiz?topic=bitcoin-atlas', '/api/v1/quiz/answer',
  '/api/v1/insights/mine', '/api/v1/insights',
]);
assert.equal(calls[0].options.credentials, 'same-origin');
assert.equal(calls[0].options.headers.Authorization, undefined);
for (const call of calls.slice(1)) assert.equal(call.options.headers.Authorization, 'Bearer memory-token');
assert.deepEqual(JSON.parse(calls[3].options.body), { topic: 'bitcoin-atlas', scene_idx: 1 });
assert.deepEqual(JSON.parse(calls[4].options.body), {
  topic: 'bitcoin-atlas', scene_idx: 8, completed: true, scene_key: 'synthetic-scene', total_scenes: 9,
});
assert.equal('localStorage' in context, false);
assert.equal('sessionStorage' in context, false);
console.log('BTC API client: OK — session stays memory-only; BTC account routes are exact');
