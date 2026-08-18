#!/usr/bin/env node
// Issue #95 / chunk 95A — contract tests for the BTC content manifest.
//
// Real exported functions, not source grep. Pure and static: no server is booted
// by this file's own assertions, no request is made, no database is touched.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  APPROVED_COURSE_IDS,
  APPROVED_SECTION_IDS,
  BTC_CONTENT_MANIFEST as MANIFEST,
  isApprovedCourseId,
  isApprovedSectionId,
  publicManifestView,
  sectionForCourseId,
} from '../src/lib/btc-content-manifest.js';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (file) => readFileSync(join(ROOT, file), 'utf8');

// ── 1. exact identity, version and access policy ─────────────────────────────
assert.equal(MANIFEST.manifestId, 'luminara_btc_v1', 'stable manifest identity');
assert.equal(MANIFEST.version, 1, 'explicit reviewable version');
assert.equal(MANIFEST.siteProfile, 'luminara_btc', 'site profile');
assert.equal(MANIFEST.siteId, 'luminara-btc', 'site id');
assert.equal(MANIFEST.accessPolicy, 'free', 'approved content is free/noncommercial');
assert.deepEqual(
  MANIFEST.interfaceLocales,
  ['ru', 'en', 'uk', 'kk', 'uz', 'es', 'fr', 'hy'],
  'the interface locale vocabulary is declared exactly',
);
// The locale vocabulary must NOT be read as a translation claim: 95D owns coverage.
assert.equal(MANIFEST.localeCoverage.status, 'pending', 'locale coverage is explicitly pending');
assert.equal(MANIFEST.localeCoverage.ownedBy, '95D', 'coverage evidence is owned by 95D');
assert.equal(MANIFEST.localeCoverage.perCourseEvidence, null, 'no per-course translation is asserted');

// ── 2. exact section order ───────────────────────────────────────────────────
assert.deepEqual(
  MANIFEST.sections.map((section) => section.id),
  ['foundations', 'bitcoin', 'ai', 'trading'],
  'the four product sections keep their exact order',
);
assert.deepEqual(APPROVED_SECTION_IDS, ['foundations', 'bitcoin', 'ai', 'trading']);
assert.deepEqual(
  MANIFEST.sections.map((section) => section.label),
  ['Основания', 'Экосистема Bitcoin', 'Искусственный интеллект', 'Трейдинг'],
  'display labels are exact',
);

// ── 3. exact course order per section ────────────────────────────────────────
const coursesOf = (sectionId) => MANIFEST.sections
  .find((section) => section.id === sectionId).courses.map((course) => course.id);
assert.deepEqual(coursesOf('foundations'), [
  'preinternet', 'web1', 'web2', 'social', 'web30', 'web3',
  'economy', 'netocracy', 'kripto-yasli', 'kripto-azbuka', 'netocracy-book',
], 'foundations catalogue order');
assert.deepEqual(coursesOf('bitcoin'), ['bitcoin-atlas'], 'bitcoin ecosystem catalogue');
assert.deepEqual(coursesOf('ai'), ['ai'], 'ai industry');
assert.deepEqual(coursesOf('trading'), ['trading'], 'trading industry');
// The Bitcoin section is a catalogue, not a single hardcoded field.
const bitcoinSection = MANIFEST.sections.find((section) => section.id === 'bitcoin');
assert.ok(Array.isArray(bitcoinSection.courses), 'the bitcoin section is a course array');
assert.equal('bitcoinCourse' in bitcoinSection, false, 'no single hardcoded bitcoinCourse field');
assert.equal(/bitcoinCourse/.test(read('src/lib/btc-content-manifest.js')), false,
  'the module declares no single-course bitcoin field');

// ── 4. every approved id is allowed ──────────────────────────────────────────
const APPROVED = [
  'preinternet', 'web1', 'web2', 'social', 'web30', 'web3', 'economy', 'netocracy',
  'kripto-yasli', 'kripto-azbuka', 'netocracy-book', 'bitcoin-atlas', 'ai', 'trading',
];
assert.deepEqual(APPROVED_COURSE_IDS, APPROVED, 'the ordered approved set is exact');
for (const id of APPROVED) {
  assert.equal(isApprovedCourseId(id), true, `${id} is approved`);
  assert.ok(sectionForCourseId(id), `${id} resolves to a section`);
}
for (const id of APPROVED_SECTION_IDS) assert.equal(isApprovedSectionId(id), true, `${id} section approved`);
assert.equal(sectionForCourseId('bitcoin-atlas'), 'bitcoin', 'bitcoin-atlas belongs to the bitcoin section');

// ── 5. excluded, hostile and unknown ids are denied ──────────────────────────
const DENIED = [
  // explicitly excluded ecosystems
  'ton', 'telegram', 'ecosystems-overview',
  'ethereum', 'eth-atlas', 'ethereum-whitepaper',
  'base', 'base-ch01',
  'rwa', 'gamefi',
  // no wildcard, prefix or group-name permission of any kind
  'bitcoin', 'bitcoin-', 'bitcoin-*', 'bitcoin-anything', 'bitcoin-atlas-2',
  'base-*', 'foundations', 'web', 'web3-extra', 'kripto', 'netocracy-book-2',
  // shape and case must be exact
  '', ' ', 'AI', 'Trading', ' ai', 'ai ', 'ai\n', 'ai/trading', 'ai,trading',
  // prototype-looking input
  '__proto__', 'constructor', 'toString', 'hasOwnProperty', 'prototype', 'valueOf',
  // unknown
  'unknown', 'course', 'null', 'undefined',
];
for (const id of DENIED) {
  assert.equal(isApprovedCourseId(id), false, `${JSON.stringify(id)} must be denied`);
  assert.equal(sectionForCourseId(id), null, `${JSON.stringify(id)} resolves to no section`);
}
// Non-string input is denied rather than coerced.
for (const value of [undefined, null, 0, 1, true, false, [], {}, ['ai'], { id: 'ai' },
  { toString: () => 'ai' }, new String('ai'), Symbol.iterator]) {
  assert.equal(isApprovedCourseId(value), false, `non-string ${String(value)} is denied`);
  assert.equal(isApprovedSectionId(value), false, `non-string ${String(value)} is denied as a section`);
}
// Section ids are not course ids and vice versa, except where the manifest says so.
assert.equal(isApprovedCourseId('foundations'), false, 'a section id is not a course id');
assert.equal(isApprovedSectionId('preinternet'), false, 'a course id is not a section id');

// ── 6. no duplicate or multi-section course ids ──────────────────────────────
const allCourses = MANIFEST.sections.flatMap((section) => section.courses.map((c) => c.id));
assert.equal(new Set(allCourses).size, allCourses.length, 'no course id appears twice');
assert.equal(new Set(APPROVED_SECTION_IDS).size, APPROVED_SECTION_IDS.length, 'no section id appears twice');
// A malformed manifest must fail at CONSTRUCTION, not at the first request. Proven
// by loading a copy of the module with a duplicate injected: the import must throw.
const source = read('src/lib/btc-content-manifest.js');
const mutations = {
  'duplicate course id': ["      { id: 'web1' },", "      { id: 'web1' },\n      { id: 'web1' },"],
  'course in two sections': ["      { id: 'bitcoin-atlas' },", "      { id: 'bitcoin-atlas' },\n      { id: 'web1' },"],
  'missing course id': ["      { id: 'preinternet' },", '      { },'],
  'duplicate section id': ["    id: 'trading',", "    id: 'ai',"],
};
for (const [label, [from, to]] of Object.entries(mutations)) {
  assert.ok(source.includes(from), `mutation fixture "${label}" still matches the module`);
  const broken = `data:text/javascript;base64,${Buffer.from(source.replace(from, to)).toString('base64')}`;
  let threw = false;
  try { await import(broken); } catch (err) { threw = /btc-content-manifest/.test(String(err.message)); }
  assert.ok(threw, `a manifest with a ${label} must fail at construction`);
}

// ── 7. nested mutation attempts change nothing ───────────────────────────────
assert.ok(Object.isFrozen(MANIFEST), 'the manifest is frozen');
assert.ok(Object.isFrozen(MANIFEST.sections), 'the section array is frozen');
assert.ok(Object.isFrozen(MANIFEST.interfaceLocales), 'the locale array is frozen');
assert.ok(Object.isFrozen(MANIFEST.localeCoverage), 'nested metadata is frozen');
for (const section of MANIFEST.sections) {
  assert.ok(Object.isFrozen(section) && Object.isFrozen(section.courses), `${section.id} is frozen`);
  for (const course of section.courses) assert.ok(Object.isFrozen(course), `${course.id} entry is frozen`);
}
const before = JSON.stringify(MANIFEST);
assert.throws(() => { MANIFEST.version = 2; }, TypeError, 'version is not writable');
assert.throws(() => { MANIFEST.accessPolicy = 'paid'; }, TypeError, 'access policy is not writable');
assert.throws(() => { MANIFEST.sections.push({ id: 'ethereum', label: 'x', courses: [] }); }, TypeError);
assert.throws(() => { MANIFEST.sections[0].courses.push({ id: 'ton' }); }, TypeError);
assert.throws(() => { MANIFEST.sections[0].courses[0].id = 'ton'; }, TypeError);
assert.throws(() => { MANIFEST.interfaceLocales.push('de'); }, TypeError);
assert.throws(() => { MANIFEST.localeCoverage.status = 'complete'; }, TypeError);
assert.throws(() => { delete MANIFEST.manifestId; }, TypeError);
assert.throws(() => { Object.defineProperty(MANIFEST, 'extra', { value: 1 }); }, TypeError);
assert.equal(JSON.stringify(MANIFEST), before, 'no mutation attempt changed the manifest');
// A mutation attempt on the returned view must not widen membership either.
const view = publicManifestView();
assert.throws(() => { view.sections[1].courses.push({ id: 'ethereum' }); }, TypeError);
assert.equal(isApprovedCourseId('ethereum'), false, 'membership is unchanged after a mutation attempt');
assert.deepEqual(APPROVED_COURSE_IDS, APPROVED, 'the approved set is unchanged');

// ── 8. deterministic, JSON-safe serialization ────────────────────────────────
const a = JSON.stringify(publicManifestView());
const b = JSON.stringify(publicManifestView());
assert.equal(a, b, 'serialization is deterministic');
assert.equal(a, JSON.stringify(JSON.parse(a)), 'the view round-trips through JSON unchanged');
assert.equal(publicManifestView(), view, 'the view is a stable reference, not a fresh mutable copy');
// No Set, Map or class instance is reachable from the view.
(function assertPlain(value, path) {
  if (value === null || typeof value !== 'object') return;
  assert.ok(Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype,
    `${path} is a plain object or array, never a Set/Map/class instance`);
  for (const [key, child] of Object.entries(value)) assertPlain(child, `${path}.${key}`);
}(publicManifestView(), 'view'));
assert.equal(a.includes('Set('), false, 'no Set leaks into serialization');

// ── 9. no commercial or excluded-ecosystem field survives serialization ──────
const serialized = a.toLowerCase();
for (const forbidden of [
  'subscription', 'subscribe', 'price', 'pricing', 'payment', 'invoice', 'plan',
  'entitlement', 'paid', 'premium', 'referral', 'points', 'reward', 'mission',
  'ton', 'telegram', 'ethereum', 'eth-atlas', 'whitepaper', 'gamefi', 'rwa',
  'ecosystems-overview',
]) {
  assert.equal(serialized.includes(forbidden), false,
    `the serialized manifest must not contain "${forbidden}"`);
}
// `base` needs a word-boundary check: it must not appear as an id of its own.
assert.equal(/"base(-[a-z0-9-]*)?"/.test(serialized), false, 'no base ecosystem id is serialized');
for (const excluded of ['ton', 'telegram', 'ecosystems-overview', 'ethereum', 'eth-atlas',
  'ethereum-whitepaper', 'base', 'base-ch01', 'rwa', 'gamefi']) {
  assert.equal(serialized.includes(`"${excluded}"`), false, `${excluded} is not serialized as an id`);
}

// ── 10. no payload can widen membership ─────────────────────────────────────
// Every exported function takes an id and nothing else. Hostile shapes that a
// Directus row or a Fastify request would present must not be accepted.
const PAYLOADS = [
  { id: 'ethereum' },
  { id: 'ethereum', approved: true },
  { courses: [{ id: 'ton' }] },
  { sections: [{ id: 'base', courses: [{ id: 'base-ch01' }] }] },
  { headers: { host: 'evil.example' }, query: { course: 'ton' } },
  { body: { id: 'gamefi' }, params: { courseId: 'gamefi' } },
  { toString: () => 'ai', valueOf: () => 'ai' },
  Object.assign(Object.create({ id: 'ai' }), {}),
  JSON.parse('{"__proto__":{"id":"ton"}}'),
];
for (const payload of PAYLOADS) {
  assert.equal(isApprovedCourseId(payload), false, 'a payload object is never approved');
  assert.equal(isApprovedSectionId(payload), false, 'a payload object is never an approved section');
  assert.equal(sectionForCourseId(payload), null, 'a payload object resolves to no section');
}
// The prototype-pollution attempt above must not have created a global back door.
assert.equal(isApprovedCourseId('ton'), false, 'ton is still denied after a pollution attempt');
assert.equal({}.id, undefined, 'Object.prototype was not polluted');
// The module reads no ambient input at all. Comments are stripped first, so the
// scan measures code rather than the prose that documents these very exclusions.
const code = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').filter((line) => !line.trim().startsWith('//')).join('\n');
for (const pattern of [/process\.env/, /process\.argv/, /require\(/, /import\s+.*from/,
  /globalThis/, /window\./, /document\./, /headers/, /\breq\b/, /directus/i, /query\(/,
  /fetch\(/, /readFileSync/]) {
  assert.equal(pattern.test(code), false, `the manifest module must not reference ${pattern}`);
}
assert.equal(/^import\s/m.test(code), false, 'the manifest module imports nothing');

console.log(
  `BTC content manifest (#95 / 95A): OK — ${MANIFEST.manifestId} v${MANIFEST.version}, `
  + `${APPROVED_SECTION_IDS.length} sections, ${APPROVED_COURSE_IDS.length} approved courses, `
  + `${DENIED.length} denied ids, ${Object.keys(mutations).length} construction failures`,
);
