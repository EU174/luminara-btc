// Issue #95 / chunk 95A — the versioned server-owned BTC content manifest.
//
// This module is DATA ONLY and pure. It reads no environment variable, hostname,
// header, query, cookie, request body, browser global, Directus record or database
// row, and it imports nothing. A content boundary that a request can influence is
// not a boundary.
//
// Permission is EXACT stable-ID membership. There is deliberately no wildcard, no
// prefix rule such as `bitcoin-*` and no group-name fallback: a future course is
// denied until it is added here explicitly, which requires a reviewed manifest
// change and a version bump.
//
// 95A defines and tests this contract only. Server serialization enforcement is
// 95B, navigation and UI are 95C, and locale coverage, licensing and attribution
// evidence are 95D. Nothing here claims a course is translated or rights-cleared.

/** Recursively freeze plain objects and arrays. Strings are already immutable. */
function deepFreeze(value) {
  if (value === null || typeof value !== 'object') return value;
  for (const key of Object.getOwnPropertyNames(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}

/** Stable identity. `version` is bumped by a reviewed change, never at runtime. */
const MANIFEST_ID = 'luminara_btc_v1';
const VERSION = 9;
const SITE_PROFILE = 'luminara_btc';
const SITE_ID = 'luminara-btc';
// Approved BTC educational content is noncommercial and free. This is a CONTENT
// POLICY: it is not a subscription, an entitlement grant or any paid-access state,
// and nothing here may be read as one.
const ACCESS_POLICY = 'free';

// The interface locale vocabulary that the product can REQUEST. It is not a claim
// that any course is fully translated: per-course availability evidence is 95D.
const INTERFACE_LOCALES = ['ru', 'en', 'uk', 'kk', 'uz', 'es', 'fr', 'hy'];

// The three ordered product sections. Order is part of the contract.
const SECTIONS = [
  {
    id: 'foundations',
    label: 'Основания',
    // Existing stable identifiers, unchanged for presentation.
    courses: [
      { id: 'preinternet' },
      { id: 'web1' },
      { id: 'web2' },
      { id: 'social' },
      { id: 'web30' },
      { id: 'economy' },
      { id: 'kripto-yasli' },
    ],
  },
  {
    id: 'bitcoin',
    label: 'Экосистема Bitcoin',
    // A catalogue, not a single hardcoded course field: a second Bitcoin course is
    // added here under review, and is denied until it is.
    courses: [
      { id: 'bitcoin-atlas' },
    ],
  },
  {
    id: 'ai',
    label: 'Искусственный интеллект',
    courses: [
      { id: 'ai' },
      { id: 'ai-open-stack' },
      { id: 'ai-production' },
    ],
  },
];

// Explicit lesson ownership, separate from course membership. Never infer it from
// a prefix, a CMS label or the request. trading is ambiguous; erc20_practice and
// defi_ton belong to ecosystems excluded from BTC and remain outside this map.
export const BTC_TOPIC_OWNERS = deepFreeze(Object.fromEntries([
  'history_of_money', 'blockchain', 'mining', 'consensus', 'security', 'scams',
].map(topic => [topic, 'kripto-yasli'])));

// OS-0: exact canonical scene keys excluded inside otherwise approved courses.
// Never infer a range from sort order or a prefix; new exceptions require review
// and a manifest version bump. Shared Directus content remains untouched.
export const BTC_EXCLUDED_SCENE_KEYS = deepFreeze([
  'blockchain:4',
  'consensus:2',
  'consensus:3',
  'consensus:4',
  'mining:3',
  'mining:4',
  'scams:1',
  'scams:3',
  'economy:3',
  'economy:5',
  'economy:6',
  'bitcoin-atlas:12-bitcoin-atlas-ch12',
]);

// OS-0b: exact approved source/version pairs. The CMS cannot expand this table.
export const BTC_SCENE_OVERRIDE_PAIRS = deepFreeze([
  {
    "ck": "bitcoin-atlas:01-bitcoin-atlas-ch01",
    "source_id": 429,
    "source_hash": "34f2bc0dbaa544efaa8af9bc204a273260969bceec1062828f7bd6be690cd4a6",
    "chunk": "C2a"
  },
  {
    "ck": "bitcoin-atlas:02-bitcoin-atlas-ch02",
    "source_id": 430,
    "source_hash": "16150b9dfe41b1276229bbf76d4a51fcfeff9c942ad4ca4209f1c76051cc87a7",
    "chunk": "C2a"
  },
  {
    "ck": "bitcoin-atlas:03-bitcoin-atlas-ch03",
    "source_id": 431,
    "source_hash": "c442f17de61a7a7ca550edd57e0285b6e7aac7009d230de0b5ef57090933372d",
    "chunk": "C2a"
  },
  {
    "ck": "bitcoin-atlas:04-bitcoin-atlas-ch04",
    "source_id": 432,
    "source_hash": "00d3cccbd5f4c2c9c4211c3c7ad35822f75b7bde8f2551da68199ca170297455",
    "chunk": "C2b"
  },
  {
    "ck": "bitcoin-atlas:05-bitcoin-atlas-ch05",
    "source_id": 433,
    "source_hash": "066d90f7177015c3b2279eb1cc6bccf5412898ead3f3545a0d0c6077cf407d77",
    "chunk": "C2b"
  },
  {
    "ck": "bitcoin-atlas:06-bitcoin-atlas-ch06",
    "source_id": 434,
    "source_hash": "362a0014222000645f2b76c281c144ddcca6c8923ea02800f002f817176f7833",
    "chunk": "C2b"
  },
  {
    "ck": "bitcoin-atlas:07-bitcoin-atlas-ch07",
    "source_id": 435,
    "source_hash": "e196db0c85d6bf4dfc30774a0aa65eeb3fedb2f73f6009acc194370cab683c0a",
    "chunk": "C2c"
  },
  {
    "ck": "bitcoin-atlas:08-bitcoin-atlas-ch08",
    "source_id": 436,
    "source_hash": "a1c6c779c2224cd671c46933a9072645994df7c5abdd24fd86393b9c651dfb35",
    "chunk": "C2c"
  },
  {
    "ck": "bitcoin-atlas:09-bitcoin-atlas-ch09",
    "source_id": 437,
    "source_hash": "2778faf7bff59cd9836a04d83b82ce64d4fecf934bef8dbd5e9c72afc3a5fbd4",
    "chunk": "C2c"
  },
  {
    "ck": "bitcoin-atlas:10-bitcoin-atlas-ch10",
    "source_id": 438,
    "source_hash": "8c213907cb4a952e1429ef3b94aeb19c136b466702aac0d39f75590ade447920",
    "chunk": "C3a-2"
  },
  {
    "ck": "bitcoin-atlas:11-bitcoin-atlas-ch11",
    "source_id": 439,
    "source_hash": "73fb950f38ad16cfe67aad1624b02c155a51ffd8f1d64bf3513e38309994c100",
    "chunk": "C3b-2"
  },
  {
    "ck": "security:0",
    "source_id": 193,
    "source_hash": "269533cc6fa434a87ea3ab4dc035c6fda937927a51e232324a793b1668595f28",
    "chunk": "C4a"
  },
  {
    "ck": "security:1",
    "source_id": 194,
    "source_hash": "fe0ea8e8d8d37bb8da255131b9b9f2677b7ffd123c14680a90a908daa08234ba",
    "chunk": "C4a"
  },
  {
    "ck": "security:2",
    "source_id": 195,
    "source_hash": "fb86ffd248f802bd7b1db527b8a2a6ba31f627b57950454dc469911067235281",
    "chunk": "C4a"
  },
  {
    "ck": "security:3",
    "source_id": 196,
    "source_hash": "c481c692fb1b838a85c552c9ceaf0420ca8954af390f036db0e5bbea1f4a8716",
    "chunk": "C4a"
  },
  {
    "ck": "security:4",
    "source_id": 197,
    "source_hash": "8e7111a1af04ca358432dbef93800ddc3750387693baf965d967e21b1371c70e",
    "chunk": "C4a"
  },
  {
    "ck": "scams:0",
    "source_id": 221,
    "source_hash": "09984a8cf4250ac902ba0ef0b06d43499c150a62079770322bf6921a3a261cae",
    "chunk": "C4b"
  },
  {
    "ck": "scams:2",
    "source_id": 223,
    "source_hash": "7c888eebf7ba23942c3e9c9c20cbfffdf4e4331eb22fc8a7fa2789c1690041ef",
    "chunk": "C4b"
  },
  {
    "ck": "scams:4",
    "source_id": 225,
    "source_hash": "6f4b7ea6c02a4f11b82cbf5878f00bb2890e370364d81e470d1f02c1c71db686",
    "chunk": "C4b"
  },
  {
    "ck": "blockchain:1",
    "source_id": 149,
    "source_hash": "92c31459b6006417e3488f0b698bb0631526f16b3d3599a5baf6a0ae6198319f",
    "chunk": "C4b"
  },
  {
    "ck": "blockchain:2",
    "source_id": 150,
    "source_hash": "98c318d765b302ea24726cb685080458e104c9c0de1b8802aadb287afb595071",
    "chunk": "C4b"
  },
  {
    "ck": "blockchain:3",
    "source_id": 151,
    "source_hash": "b6a5d6c02506b07764b17db91f70c7dd1ef85753996717a1c035a527aa2316d1",
    "chunk": "C4b"
  },
  {
    "ck": "consensus:0",
    "source_id": 158,
    "source_hash": "63da6b3d5db8713fc0dbbbd01b935302abe1bd86e2b60a646d99ac91144d9808",
    "chunk": "C4b"
  },
  {
    "ck": "consensus:1",
    "source_id": 159,
    "source_hash": "fa006a5d5626388fbb38bf2f4eb3a292c0df4a13aa071a9f87460ca82899e3bd",
    "chunk": "C4b"
  },
  {
    "ck": "economy:0",
    "source_id": 127,
    "source_hash": "fcd397d36e1930f7718a8f79ad0bc7a0e34992475f7ae193f49615daecfc99cf",
    "chunk": "C5"
  },
  {
    "ck": "economy:1",
    "source_id": 128,
    "source_hash": "5f12c8cc4e52931850db1a7362d9228b70cb35e738ea19a83ea88563a64c5e6e",
    "chunk": "C5"
  },
  {
    "ck": "economy:4",
    "source_id": 131,
    "source_hash": "53ef4c7da2d8e3cebbf47e92e06b3bc3fa015b8159850e676bca99b85eff085b",
    "chunk": "C5"
  },
  {
    "ck": "economy:2",
    "source_id": 129,
    "source_hash": "98c6308e6fb5d0fb30e306316a192133106978525c62f2f38242d0006205ad89",
    "chunk": "C5"
  },
  {
    "ck": "preinternet:4",
    "source_id": 88,
    "source_hash": "aa567931de12927bcb963dba023be2c31a2ece7fe7b9a42ecdda2eef6b22a06d",
    "chunk": "C5"
  },
  {
    "ck": "web2:2",
    "source_id": 101,
    "source_hash": "1397f43439590861269af09abaf0f45135bf6f1130bfdd93e8d158d946d971e4",
    "chunk": "C5"
  },
  {
    "ck": "preinternet:7",
    "source_id": 91,
    "source_hash": "90fad93e3e3522f5db8dd19a6ff3a9b765f16f64659825518e90418c68eec7db",
    "chunk": "WEB3-12-20261112"
  },
  {
    "ck": "social:4",
    "source_id": 110,
    "source_hash": "59735d17c7551329f78b79eaf0835e40cbc18acd24c63d4f3533dfc69646ec7f",
    "chunk": "WEB3-12-20261112"
  },
  {
    "ck": "social:6",
    "source_id": 112,
    "source_hash": "1242ec1681f4b80808eeb4d35742b7c6bc61586b3bda51a5cc2799bd80659e2f",
    "chunk": "WEB3-12-20261112"
  },
  {
    "ck": "web1:3",
    "source_id": 96,
    "source_hash": "c39aa48a7c87caabb60d9a1c5f75c459462276a0352f02df8458b9bc8f886247",
    "chunk": "WEB3-12-20261112"
  },
  {
    "ck": "web2:4",
    "source_id": 103,
    "source_hash": "a6901d8e1b70e3c5c49781f9964766e481e889fd5c99b272d26d69624f5c2c61",
    "chunk": "WEB3-12-20261112"
  },
  {
    "ck": "web30:0",
    "source_id": 113,
    "source_hash": "5d64fb2a8fcdde3f552e48d0a5abfbf3afb6b2be7a2171c688301cadb2c7fe27",
    "chunk": "WEB3-12-20261112"
  },
  {
    "ck": "web30:3",
    "source_id": 116,
    "source_hash": "d35812b5e2bd3e6200f67439cb42853098db9dc7e3ab4d34e813dc2e29a73c95",
    "chunk": "WEB3-12-20261112"
  },
  {
    "ck": "preinternet:1",
    "source_id": 85,
    "source_hash": "bd6f0e2c3367c0fe15176b7147e91f5a8f6dfdf3bccff234f4727ced344f75f9",
    "chunk": "EDITORIAL-HY-20261112"
  },
  {
    "ck": "social:3",
    "source_id": 109,
    "source_hash": "a6798558af66d0bb0980fed93fadfa50dc6db08925b17eb17904dbd6491cf2d6",
    "chunk": "EDITORIAL-HY-20261112"
  },
  {
    "ck": "web2:6",
    "source_id": 105,
    "source_hash": "0d8a5627ec3478a9c3e695a0b2ecacaed56c653d67ce15ffd67b8f08c606eca3",
    "chunk": "BTC-EDITORIAL-SIX-20261113"
  }
]);
const OVERRIDE_BY_CK = new Map(BTC_SCENE_OVERRIDE_PAIRS.map(pair => [pair.ck, pair]));

export function sceneOverrideForCk(ck) {
  return typeof ck === 'string' ? OVERRIDE_BY_CK.get(ck) || null : null;
}

// Presentation follows successful whole-scene selection; raw CMS titles stay
// immutable and continue to be checked by the resolver before this projection.
export const BTC_SCENE_PRESENTATION_OVERRIDES = deepFreeze({
  "web30:0": {
    "topic_key": "web30",
    "sort": 0,
    "title": {
      "ru": "Семантическая паутина: данные, связи и смысл",
      "en": "The Semantic Web: data, relationships and meaning",
      "uk": "Семантична павутина: дані, зв’язки та значення",
      "kk": "Семантикалық веб: деректер, байланыстар және мағына",
      "uz": "Semantik veb: ma’lumotlar, aloqalar va ma’no",
      "es": "La web semántica: datos, relaciones y significado",
      "fr": "Le Web sémantique : données, relations et sens",
      "hy": "Իմաստային վեբը․ տվյալներ, կապեր և իմաստ"
    }
  }
});

// BTC-only catalogue wording. This does not authorize content or alter CMS rows.
export const BTC_TOPIC_PRESENTATION_OVERRIDES = deepFreeze({
  "bitcoin-atlas": {
    "blurb": {
      "ru": "История, технология и культура Bitcoin в 11 главах.",
      "en": "Bitcoin history, technology and culture in 11 chapters."
    }
  }
});

// Exact internal substitutions: preserve bookmarks without serving shared text.
export const BTC_MAP_OVERRIDES = deepFreeze({
  '/maps/preinternet.ru.html': '/maps/preinternet.ru.btc.html',
  '/maps/preinternet.en.html': '/maps/preinternet.en.btc.html',
  '/maps/preinternet.uk.html': '/maps/preinternet.uk.btc.html',
  '/maps/preinternet.kk.html': '/maps/preinternet.kk.btc.html',
  '/maps/preinternet.uz.html': '/maps/preinternet.uz.btc.html',
  '/maps/preinternet.es.html': '/maps/preinternet.es.btc.html',
  '/maps/preinternet.fr.html': '/maps/preinternet.fr.btc.html',
  '/maps/preinternet.hy.html': '/maps/preinternet.hy.btc.html',
});

// ── construction-time assertions ─────────────────────────────────────────────
// A malformed manifest must fail at import, not at the first request.
const fail = (message) => { throw new Error(`btc-content-manifest: ${message}`); };
const isStableId = (value) => typeof value === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);

const seenSections = new Set();
const courseOwner = new Map();
for (const section of SECTIONS) {
  if (!isStableId(section.id)) fail(`section id is missing or malformed: ${JSON.stringify(section.id)}`);
  if (seenSections.has(section.id)) fail(`duplicate section id: ${section.id}`);
  seenSections.add(section.id);
  if (typeof section.label !== 'string' || !section.label.trim()) {
    fail(`section ${section.id} has no display label`);
  }
  if (!Array.isArray(section.courses) || section.courses.length === 0) {
    fail(`section ${section.id} must declare a non-empty course catalogue`);
  }
  const seenInSection = new Set();
  for (const course of section.courses) {
    if (!course || !isStableId(course.id)) {
      fail(`course id is missing or malformed in section ${section.id}: ${JSON.stringify(course && course.id)}`);
    }
    if (seenInSection.has(course.id)) fail(`duplicate course id in section ${section.id}: ${course.id}`);
    seenInSection.add(course.id);
    if (courseOwner.has(course.id)) {
      fail(`course ${course.id} appears in both ${courseOwner.get(course.id)} and ${section.id}`);
    }
    courseOwner.set(course.id, section.id);
  }
}
if (new Set(INTERFACE_LOCALES).size !== INTERFACE_LOCALES.length) fail('duplicate interface locale');

for (const [topic, owner] of Object.entries(BTC_TOPIC_OWNERS)) {
  if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(topic) || courseOwner.has(topic)
      || !courseOwner.has(owner)) fail(`invalid lesson ownership: ${topic}`);
}

const EXCLUDED_SCENES = new Set(BTC_EXCLUDED_SCENE_KEYS);
if (EXCLUDED_SCENES.size !== BTC_EXCLUDED_SCENE_KEYS.length) fail('duplicate excluded scene key');
for (const ck of BTC_EXCLUDED_SCENE_KEYS) {
  if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*:[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(ck)) {
    fail(`invalid excluded scene key: ${ck}`);
  }
}

if (OVERRIDE_BY_CK.size !== BTC_SCENE_OVERRIDE_PAIRS.length) fail('duplicate scene override');
for (const pair of BTC_SCENE_OVERRIDE_PAIRS) {
  const topic = pair.ck.split(':')[0];
  if (!isApprovedScene(pair.ck, topic) || !Number.isSafeInteger(pair.source_id) || pair.source_id <= 0
      || !/^[a-f0-9]{64}$/.test(pair.source_hash) || !pair.chunk) fail(`invalid scene override: ${pair.ck}`);
}

for (const [ck, presentation] of Object.entries(BTC_SCENE_PRESENTATION_OVERRIDES)) {
  if (!OVERRIDE_BY_CK.has(ck) || presentation.topic_key !== ck.split(':')[0]
      || !Number.isInteger(presentation.sort) || presentation.sort < 0
      || !presentation.title || Object.keys(presentation.title).length !== INTERFACE_LOCALES.length
      || INTERFACE_LOCALES.some(locale => typeof presentation.title[locale] !== 'string'
        || !presentation.title[locale].trim())) fail(`invalid scene presentation: ${ck}`);
}

/** Resolve a topic to its approved parent without changing its canonical key. */
export function courseIdForTopic(topic) {
  if (typeof topic !== 'string') return null;
  return courseOwner.has(topic) ? topic
    : (Object.prototype.hasOwnProperty.call(BTC_TOPIC_OWNERS, topic) ? BTC_TOPIC_OWNERS[topic] : null);
}

/** Exact exception lookup; a scene key never determines course ownership. */
export function isExcludedSceneKey(ck) {
  return typeof ck === 'string' && EXCLUDED_SCENES.has(ck);
}

/** Approved authoritative owner AND an exact, non-excluded canonical scene key. */
export function isApprovedScene(ck, topic) {
  return typeof ck === 'string' && !!ck && courseIdForTopic(topic) !== null
    && !isExcludedSceneKey(ck);
}

/** The immutable manifest. Deep-frozen: sections, courses and locales all resist mutation. */
export const BTC_CONTENT_MANIFEST = deepFreeze({
  manifestId: MANIFEST_ID,
  version: VERSION,
  siteProfile: SITE_PROFILE,
  siteId: SITE_ID,
  accessPolicy: ACCESS_POLICY,
  topicOwners: BTC_TOPIC_OWNERS,
  excludedSceneKeys: BTC_EXCLUDED_SCENE_KEYS,
  sceneOverrides: BTC_SCENE_OVERRIDE_PAIRS,
  mapOverrides: BTC_MAP_OVERRIDES,
  interfaceLocales: INTERFACE_LOCALES.slice(),
  // The requested/interface vocabulary is separate from per-course availability.
  // Coverage, licensing and attribution evidence are explicitly still pending.
  localeCoverage: {
    status: 'pending',
    ownedBy: '95D',
    // No course is asserted here to be fully translated or rights-cleared.
    perCourseEvidence: null,
  },
  sections: SECTIONS.map((section) => ({
    id: section.id,
    label: section.label,
    courses: section.courses.map((course) => ({ id: course.id })),
  })),
});

// Internal lookup structures. They are never exported and never returned, so no
// caller can reach a mutable Set or Map through this module.
const APPROVED_SECTIONS = new Set(SECTIONS.map((section) => section.id));
const APPROVED_COURSES = new Set(courseOwner.keys());

/** Ordered approved course ids, frozen. */
export const APPROVED_COURSE_IDS = deepFreeze([...courseOwner.keys()]);
/** Ordered approved section ids, frozen. */
export const APPROVED_SECTION_IDS = deepFreeze(SECTIONS.map((section) => section.id));

/**
 * Exact-membership predicate for a course id.
 *
 * Takes an id and nothing else. There is no overload that accepts a request, a
 * Directus record or an options bag, so no caller can widen membership by handing
 * this function a payload. A non-string, an object, an inherited property name and
 * anything not listed above all answer false.
 */
export function isApprovedCourseId(courseId) {
  if (typeof courseId !== 'string') return false;
  return APPROVED_COURSES.has(courseId);
}

/** Exact-membership predicate for a section id, with the same rules. */
export function isApprovedSectionId(sectionId) {
  if (typeof sectionId !== 'string') return false;
  return APPROVED_SECTIONS.has(sectionId);
}

/** The section owning an approved course, or null. Never throws on hostile input. */
export function sectionForCourseId(courseId) {
  if (typeof courseId !== 'string' || !APPROVED_COURSES.has(courseId)) return null;
  return courseOwner.get(courseId);
}

// The serializable public view. Built once, deep-frozen and returned by reference:
// deterministic across calls, JSON-safe, and containing only plain objects, arrays,
// strings, numbers and null — never a Set, a Map or a class instance.
const PUBLIC_VIEW = deepFreeze(JSON.parse(JSON.stringify(BTC_CONTENT_MANIFEST)));

/** A safe, deterministic, JSON-serializable view of the manifest. */
export function publicManifestView() {
  return PUBLIC_VIEW;
}
