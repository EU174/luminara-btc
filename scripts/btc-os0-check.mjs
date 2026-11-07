#!/usr/bin/env node
// Public snapshot OS-0 parity: synthetic prose, identifier-only metadata, no live services.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { BTC_CONTENT_MANIFEST, BTC_TOPIC_OWNERS, isApprovedScene } from '../src/lib/btc-content-manifest.js';
import { BTC_CONTENT_POLICY, allowsScene, visibleQuizQuestion } from '../src/lib/content-policy.js';

process.env.NODE_ENV = 'test';
process.env.DIRECTUS_URL = 'https://cms.invalid';
process.env.DIRECTUS_TOKEN = 'synthetic-public-os0';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const fixture = JSON.parse(read('scripts/fixtures/btc-os0-scenes.json'));
const hiddenCourses = ['web3', 'netocracy', 'netocracy-book', 'kripto-azbuka'];
const hiddenTopics = ['okx', 'first_wallet', 'wallets', 'buy_sell', 'dex_dapp', 'stablecoins', 'trading_basics', 'aggregators', 'final', 'iot'];
const hiddenKeys = ['blockchain:4', 'consensus:2', 'consensus:3', 'consensus:4', 'mining:3', 'mining:4', 'scams:1', 'scams:3',
  'economy:3', 'economy:5', 'economy:6', 'bitcoin-atlas:12-bitcoin-atlas-ch12'];
const rows = fixture.scenes.map(([id, ck, topic_key, sort]) => ({ id, ck, topic_key, sort, status: 'published', access: 'free',
  title: { en: ck }, body: { simple: { en: `Synthetic ${ck}` }, extended: { en: `Synthetic ${ck}` }, deep: { en: 'deep' }, academic: { en: 'academic' } } }));
const hidden = rows.filter(row => hiddenCourses.includes(row.topic_key) || hiddenTopics.includes(row.topic_key) || hiddenKeys.includes(row.ck));
const visible = rows.filter(row => !hidden.includes(row));
assert.equal(rows.length, 252);
assert.equal(hidden.length, 125);
assert.equal(visible.length, 127);
assert.deepEqual(BTC_CONTENT_MANIFEST.excludedSceneKeys, hiddenKeys);
assert.equal(BTC_CONTENT_MANIFEST.version, 5);
assert.equal(BTC_CONTENT_POLICY.cacheNamespace, 'luminara_btc|luminara_btc_v1|v5');
for (const row of rows) assert.equal(allowsScene(BTC_CONTENT_POLICY, row), visible.includes(row), row.ck);
assert.equal(visible.filter(row => ['ai', 'ai-open-stack', 'ai-production'].includes(row.topic_key)).length, 53);
const topics = [...new Set(rows.map(row => row.topic_key))].map(key => ({ key, title: { en: key }, status: 'published' }));
const questions = ['preinternet','web1','web2','social','web30','web3','economy','netocracy'].flatMap(topic_key => [1,2,3].map(n => ({
  id: `${topic_key}:q0${n}`, topic_key, scene_ck: `${topic_key}:6`, status: 'published', prompt: { en: `Synthetic question ${n}` },
  options: [{ id: 'a', text: { en: 'Synthetic option' }, is_correct: true }],
})));
assert.equal(visibleQuizQuestion(BTC_CONTENT_POLICY, questions.find(q => q.id === 'economy:q03')), null);
assert.equal(visibleQuizQuestion(BTC_CONTENT_POLICY, questions.find(q => q.id === 'economy:q02')).scene_ck, 'economy:4');
let calls = 0;
globalThis.fetch = async url => {
  calls++;
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://cms.invalid');
  assert.ok(![...parsed.searchParams.keys()].some(key => key.startsWith('filter') || key === 'sort'));
  const data = parsed.pathname.endsWith('/lum_scenes') ? rows
    : parsed.pathname.endsWith('/lum_topics') ? topics
      : parsed.pathname.endsWith('/lum_quiz_questions') ? questions
        : parsed.pathname.endsWith('/lum_topic_media') ? rows.map(row => ({ topic_key: `scene:${row.ck}` })) : [];
  const limit = Number(parsed.searchParams.get('limit') || 100), page = Number(parsed.searchParams.get('page') || 1);
  return new Response(JSON.stringify({ data: data.slice((page - 1) * limit, page * limit) }));
};
const { buildApp } = await import('../src/app.js');
const { pool } = await import('../src/lib/db.js');
const app = await buildApp({ logger: false });
let requests = 0;
const send = url => app.inject({ url, remoteAddress: `10.4.${Math.floor(++requests / 200)}.${requests % 200 + 1}` });
try {
  for (const ck of hiddenKeys) for (const suffix of ['', '/level/deep', '/level/academic']) {
    assert.equal((await send(`/api/v1/content/scene/${encodeURIComponent(ck)}${suffix}`)).statusCode, 404, ck);
  }
  assert.equal(calls, 0, 'exact scene exceptions are refused before fetching');
  const bootstrap = await send('/api/v1/content/bootstrap');
  assert.equal(bootstrap.statusCode, 200);
  const data = bootstrap.json();
  assert.deepEqual(data.scenes.map(row => row.ck).sort(), visible.map(row => row.ck).sort());
  assert.ok(data.scenes.every(row => isApprovedScene(row.ck, row.topic_key)));
  assert.ok(!data.media.some(row => hidden.some(scene => row.topic_key === `scene:${scene.ck}`)));
  const before = calls;
  for (const topic of [...hiddenCourses, ...hiddenTopics, 'trading']) {
    assert.equal((await send(`/api/v1/content/topic/${topic}`)).statusCode, 404, topic);
  }
  assert.equal(calls, before);
  for (const row of hidden) for (const suffix of ['', '/level/deep', '/level/academic']) {
    assert.equal((await send(`/api/v1/content/scene/${encodeURIComponent(row.ck)}${suffix}`)).statusCode, 404, row.ck);
  }
  for (const key of Object.keys(BTC_TOPIC_OWNERS)) assert.equal((await send(`/api/v1/content/topic/${key}`)).statusCode, 200, key);
  for (const row of visible) assert.equal((await send(`/api/v1/content/scene/${encodeURIComponent(row.ck)}`)).statusCode, 200, row.ck);
  for (const topic of ['web3','netocracy']) assert.equal((await send(`/api/v1/quiz?topic=${topic}`)).statusCode, 404);
  const economy = await send('/api/v1/quiz?topic=economy');
  assert.equal(economy.statusCode, 200, economy.body);
  assert.equal(economy.json().total, 2);
  assert.ok(economy.json().questions.every(q => q.scene_ck === 'economy:4'));
  for (const map of ['web3.ru.html','luminara-demo-web3.html','netocracy.ru.html','luminara-demo-netocracy.html','economy.ru.html']) {
    assert.equal((await send(`/maps/${map}`)).statusCode, 404);
  }
  assert.equal((await send('/maps/luminara-demo-bitcoin.html')).statusCode, 200);
} finally { await app.close(); await pool.end(); }

// Execute the shipped client against a deliberately over-broad CMS-shaped fixture.
const elements = { app: { innerHTML: '', textContent: '' }, language: {}, quiz: { innerHTML: '', querySelectorAll: () => [] } };
const events = {};
const location = { hash: '#/foundations' };
const context = { URLSearchParams, location, console,
  localStorage: { getItem: () => 'en', setItem() {} },
  document: { getElementById: id => elements[id], documentElement: {}, addEventListener() {} },
  window: { addEventListener: (name, fn) => { events[name] = fn; }, LuminaraBtcApi: { bootstrap: async () => { throw Error('anonymous fixture'); }, quiz: async () => ({ questions: [{ id: 'economy:q02', prompt: { en: 'Synthetic quiz prompt' }, options: [] }] }) } },
  fetch: async () => ({ ok: true, json: async () => ({ manifest: BTC_CONTENT_MANIFEST, topics,
    scenes: rows, media: [] }) }),
};
vm.runInNewContext(read('src/public/v62/btc-app.js'), context);
await new Promise(resolve => setImmediate(resolve));
const renderedTopics = () => [...elements.app.innerHTML.matchAll(/href="([^"]+)"/g)]
  .map(match => new URLSearchParams(match[1].replace(/&amp;/g, '&').split('?')[1] || '').get('c')).filter(Boolean);
assert.ok(elements.app.innerHTML.includes('c=kripto-yasli'));
assert.ok(!renderedTopics().includes('web3'));
location.hash = '#/industries'; events.hashchange();
for (const key of ['ai','ai-open-stack','ai-production']) assert.ok(elements.app.innerHTML.includes(`c=${key}`), key);
assert.ok(!renderedTopics().includes('trading'));
location.hash = '#/scene?c=kripto-yasli&s=0'; events.hashchange();
assert.ok(elements.app.innerHTML.includes('c=consensus'));
assert.ok(!renderedTopics().includes('okx'));
location.hash = '#/scene?c=economy&s=2'; events.hashchange();
assert.ok(elements.app.innerHTML.includes('Synthetic economy:2'));
assert.ok(elements.app.innerHTML.includes('s=4'));
assert.ok(!elements.app.innerHTML.includes('s=3'));
location.hash = '#/scene?c=economy&s=3'; events.hashchange();
assert.ok(elements.app.innerHTML.includes('Course content is unavailable'));
assert.ok(!elements.app.innerHTML.includes('Synthetic economy:4'));

location.hash = '#/quiz?c=economy'; events.hashchange();
await new Promise(resolve => setImmediate(resolve));
assert.ok(elements.quiz.innerHTML.includes('Synthetic quiz prompt'), 'client renders the API prompt field');

const readme = read('README.md');
const direction = readme.split('## Product direction')[1].split('\n## ')[0];
assert.ok(!/trading/i.test(direction));
assert.match(readme, /grew out of the broader Luminara/);
assert.match(readme, /Exclusions are intentionally public/);
console.log('Public OS-0 v5: OK — 125 hidden / 127 retained, topic ownership, direct API/levels, quizzes/maps and shipped client');
