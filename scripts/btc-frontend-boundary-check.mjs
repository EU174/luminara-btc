#!/usr/bin/env node
// Public-export contract: the browser bundle must be BTC-only in source, not
// merely hidden behind a product-profile branch.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (file) => readFileSync(join(root, file), 'utf8');
const html = read('src/public/v62.html');
const api = read('src/public/v62/btc-api.js');
const app = read('src/public/v62/btc-app.js');
const css = read('src/public/v62/btc.css');
const personalCss = read('src/public/v62/btc-personal.css');

assert.match(html, /v62\/btc\.css/);
assert.match(html, /v62\/btc-personal\.css/);
assert.match(html, /v62\/btc-api\.js/);
assert.match(html, /v62\/btc-app\.js/);
assert.doesNotMatch(html, /type=["']text\/babel|react(?:-dom)?|content-graph|directus-loader|share-link/);
assert.match(app, /fetch\('\/api\/v1\/content\/bootstrap'/);
assert.match(app, /youtube-nocookie\.com/);
assert.match(app, /luminara-demo-/);
assert.match(app, /Luminara_Auth\.html/);
assert.match(app, /foundation = \[/);
assert.match(app, /bitcoin-atlas/);
assert.match(app, /'ai','trading'/);
assert.match(api, /Memory-only client/);
assert.match(api, /credentials: 'same-origin'/);
assert.doesNotMatch(api, /localStorage|sessionStorage/);
assert.match(css, /color-scheme:light/);
assert.match(personalCss, /\.personal/);

for (const removed of [
  'api.js', 'app-shell.jsx', 'atlas3d.jsx', 'auth-return.js', 'content-graph.js',
  'directus-loader.js', 'ecosystems.jsx', 'foundations.jsx', 'i18n.js',
  'locale-resolve.client.js', 'profile-provider-loader.js', 'progress-model.js',
  'research.jsx', 'share-link.js', 'sources.js', 'styles.css', 'tweaks-panel.jsx',
]) assert.equal(existsSync(join(root, 'src/public/v62', removed)), false, `${removed} is excluded`);

const names = readdirSync(join(root, 'src/public/v62')).sort();
assert.deepEqual(names, ['CONTEXT.md', 'btc-api.js', 'btc-app.js', 'btc-personal.css', 'btc.css']);
console.log('BTC public frontend boundary: OK — one light BTC client; legacy browser modules absent');
