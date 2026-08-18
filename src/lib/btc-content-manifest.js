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
const VERSION = 1;
const SITE_PROFILE = 'luminara_btc';
const SITE_ID = 'luminara-btc';
// Approved BTC educational content is noncommercial and free. This is a CONTENT
// POLICY: it is not a subscription, an entitlement grant or any paid-access state,
// and nothing here may be read as one.
const ACCESS_POLICY = 'free';

// The interface locale vocabulary that the product can REQUEST. It is not a claim
// that any course is fully translated: per-course availability evidence is 95D.
const INTERFACE_LOCALES = ['ru', 'en', 'uk', 'kk', 'uz', 'es', 'fr', 'hy'];

// The four ordered product sections. Order is part of the contract.
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
      { id: 'web3' },
      { id: 'economy' },
      { id: 'netocracy' },
      { id: 'kripto-yasli' },
      { id: 'kripto-azbuka' },
      { id: 'netocracy-book' },
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
    ],
  },
  {
    id: 'trading',
    label: 'Трейдинг',
    courses: [
      { id: 'trading' },
    ],
  },
];

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

/** The immutable manifest. Deep-frozen: sections, courses and locales all resist mutation. */
export const BTC_CONTENT_MANIFEST = deepFreeze({
  manifestId: MANIFEST_ID,
  version: VERSION,
  siteProfile: SITE_PROFILE,
  siteId: SITE_ID,
  accessPolicy: ACCESS_POLICY,
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
