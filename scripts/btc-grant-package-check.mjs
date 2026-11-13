import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BTC_CONTENT_MANIFEST} from '../src/lib/btc-content-manifest.js';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
for(const name of ['web3.ru.html','netocracy.ru.html','economy.ru.html','luminara-demo-web3.html','luminara-demo-netocracy.html'])assert.equal(fs.existsSync(new URL('src/public/maps/'+name,root)),false,`excluded map present: ${name}`);
assert.equal(BTC_CONTENT_MANIFEST.version,9);
assert.equal(BTC_CONTENT_MANIFEST.sceneOverrides.length,40);
assert.match(read('LICENSE'),/GNU AFFERO GENERAL PUBLIC LICENSE/);
for(const p of ['CONTENT-LICENSE','content/LICENSE']){
 const s=read(p);assert.match(s,/CC-BY-SA-4.0/);assert.match(s,/without a funding condition/);assert.match(s,/third-party/);
}
const index=JSON.parse(read('content/index.json'));
assert.equal(index.grantScenes,74);assert.equal(index.aiScenesOutsideGrant,53);assert.equal(index.scenes.length,74);
assert.equal(new Set(index.scenes.map(x=>x.ck)).size,74);
const blockedKeys=new Set(['id','source_id','source_hash','email','telegram_id','external_id','access_token','refresh_token','password']);
function inspect(v){if(Array.isArray(v))v.forEach(inspect);else if(v&&typeof v==='object')for(const [k,x]of Object.entries(v)){assert.ok(!blockedKeys.has(k),'private field exported: '+k);inspect(x);}}
for(const entry of index.scenes){
 assert.ok(!entry.ck.startsWith('ai'));
 assert.match(entry.file,/^scenes\/[a-z0-9_-]+\.json$/);
 const scene=JSON.parse(read('content/'+entry.file));assert.equal(scene.ck,entry.ck);assert.equal(scene.canonicalUrl,entry.url);assert.match(entry.url,/^https:\/\/luminarabtc\.academy\/atlas#\//);assert.equal(scene.license,'CC-BY-SA-4.0');assert.ok(scene.title);assert.ok(scene.body);inspect(scene);
}
assert.match(read('PRIVACY.md'),/Eugene Nasyrov/);assert.match(read('PRIVACY.md'),/luminara.edtech@gmail.com/);
console.log('BTC grant package PASS: five excluded maps absent, v9/40, 74 educational exports, no CMS identity/account fields, scoped CC licence');
