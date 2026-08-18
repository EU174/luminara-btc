#!/usr/bin/env node
// Issue #95 / chunk 95D — fail-closed localization, licence and attribution gate.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

import assert from 'node:assert/strict';
import {
  BTC_CONTENT_COURSE_EVIDENCE,
  BTC_CONTENT_EVIDENCE as EVIDENCE,
  BTC_CONTENT_EVIDENCE_ID,
  BTC_CONTENT_EVIDENCE_VERSION,
  BTC_CONTENT_LOCALES,
} from '../src/lib/btc-content-evidence.js';
import {
  APPROVED_COURSE_IDS,
  BTC_CONTENT_MANIFEST,
} from '../src/lib/btc-content-manifest.js';

const EXPECTED_LOCALES = ['ru', 'en', 'uk', 'kk', 'uz', 'es', 'fr', 'hy'];
const ALLOWED_AVAILABILITY = new Set(['candidate', 'unavailable', 'unverified']);
const ALLOWED_QA = new Set(['passed', 'failed', 'not_run']);

assert.equal(EVIDENCE.evidenceId, BTC_CONTENT_EVIDENCE_ID);
assert.equal(EVIDENCE.version, BTC_CONTENT_EVIDENCE_VERSION);
assert.equal(EVIDENCE.siteProfile, 'luminara_btc');
assert.deepEqual(BTC_CONTENT_LOCALES, EXPECTED_LOCALES);
assert.deepEqual(EVIDENCE.requestedLocales, EXPECTED_LOCALES);
assert.equal(BTC_CONTENT_MANIFEST.localeCoverage.status, 'pending',
  'the immutable 95A manifest delegates detailed evidence to 95D');
assert.equal(BTC_CONTENT_MANIFEST.localeCoverage.ownedBy, '95D');

// The owner selected English for first launch. Other interface locales retain
// the user's preference but may only fall back to one complete English document
// with a visible notice — never silently mix languages within a lesson.
assert.equal(EVIDENCE.localePolicy.status, 'owner_approved_initial_policy');
assert.equal(EVIDENCE.localePolicy.primaryLocale, 'en');
assert.deepEqual(EVIDENCE.localePolicy.launchLocales, ['en']);
assert.equal(EVIDENCE.localePolicy.fallbackLocale, 'en');
assert.equal(EVIDENCE.localePolicy.fallbackPolicy, 'explicit_full_document_with_visible_notice');
assert.equal(EVIDENCE.localePolicy.preserveRequestedLocale, true);
assert.equal(EVIDENCE.publicationPolicy.status, 'blocked');
assert.equal(EVIDENCE.publicationPolicy.thirdPartyMaterial,
  'do_not_copy_unreviewed_third_party_material');
assert.equal(EVIDENCE.publicationPolicy.formalRightsClearance, 'deferred_by_owner');

const assignedCourses = EVIDENCE.sourceGroups.flatMap((group) => group.courseIds);
assert.deepEqual([...assignedCourses].sort(), [...APPROVED_COURSE_IDS].sort(),
  'every approved course must have exactly one evidence owner');
assert.equal(new Set(assignedCourses).size, assignedCourses.length,
  'a course cannot inherit conflicting evidence from two source groups');
assert.deepEqual(Object.keys(BTC_CONTENT_COURSE_EVIDENCE).sort(), [...APPROVED_COURSE_IDS].sort());

for (const group of EVIDENCE.sourceGroups) {
  assert.match(group.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(group.courseIds.length > 0, `${group.id}: course ownership is required`);
  assert.deepEqual(Object.keys(group.localeCoverage), EXPECTED_LOCALES,
    `${group.id}: every requested locale must be explicit and ordered`);

  for (const locale of EXPECTED_LOCALES) {
    const item = group.localeCoverage[locale];
    assert.ok(ALLOWED_AVAILABILITY.has(item.availability), `${group.id}/${locale}: explicit availability`);
    assert.ok(ALLOWED_QA.has(item.contentQa), `${group.id}/${locale}: explicit Content QA status`);
    assert.equal(item.editorialReview, 'unverified', `${group.id}/${locale}: no invented editorial approval`);
    assert.equal(item.launchEligible, false, `${group.id}/${locale}: no unreviewed launch claim`);
    assert.equal(item.fallback, locale === 'en' ? 'none' : 'en_with_visible_notice',
      `${group.id}/${locale}: fallback must be explicit and whole-document`);
    assert.equal(typeof item.evidenceRef, 'string');
    assert.ok(item.evidenceRef.length > 0);
    if (item.availability === 'unavailable') {
      assert.equal(item.unitsPresent, 0, `${group.id}/${locale}: unavailable means zero candidate units`);
    }
    if (item.contentQa === 'passed') {
      assert.equal(item.unitsPresent, item.unitsExpected,
        `${group.id}/${locale}: QA cannot pass an incomplete structural inventory`);
    }
  }

  // The owner explicitly chose an internal-origin attestation instead of formal
  // legal clearance. Preserve that decision without inventing a registered
  // Luminara entity or a third-party/open-content licence.
  assert.equal(group.rights.status, 'owner_attested_internal_origin');
  assert.equal(group.rights.rightsBasis, 'created_by_luminara_team_with_ai_assistance');
  assert.equal(group.rights.licenseId, null, `${group.id}: no public reuse licence is asserted`);
  assert.equal(group.rights.rightsHolderClaim, 'Luminara project team (unincorporated)');
  assert.equal(group.rights.legalEntityStatus, 'not_registered');
  assert.deepEqual(group.rights.attribution,
    ['Created by the Luminara project team with AI assistance.']);
  assert.equal(group.rights.nonprofitReuse, 'owner_approved');
  assert.equal(group.rights.formalClearance, 'deferred_by_owner');
  assert.equal(group.rights.knownThirdPartyCopying, 'none_declared_by_owner');
  assert.deepEqual(group.rights.evidenceRefs, ['owner-decision:2026-08-16']);
  assert.ok(group.rights.residualRisk.length > 0);
  assert.equal(group.review.status, 'unverified');
  assert.equal(group.review.owner, null);
}

const groupById = Object.fromEntries(EVIDENCE.sourceGroups.map((group) => [group.id, group]));
const netocracy = groupById['netocracy-book-v108-9'];
for (const locale of EXPECTED_LOCALES) {
  assert.equal(netocracy.localeCoverage[locale].unitsPresent, 25);
  assert.equal(netocracy.localeCoverage[locale].contentQa, 'passed');
}

const bitcoin = groupById['bitcoin-atlas-v106-4'];
assert.equal(bitcoin.localeCoverage.ru.contentQa, 'failed');
assert.equal(bitcoin.localeCoverage.hy.contentQa, 'failed');
assert.equal(bitcoin.localeCoverage.en.unitsPresent, 12);

const trading = groupById['trading-corrected-v2'];
for (const locale of ['ru', 'uk', 'kk', 'uz', 'hy']) {
  assert.equal(trading.localeCoverage[locale].contentQa, 'failed');
}
assert.equal(trading.localeCoverage.en.unitsPresent, 31);

const ai = groupById['ai-course-source-packages-v1'];
for (const locale of ['uz', 'hy']) assert.equal(ai.localeCoverage[locale].availability, 'unavailable');
for (const locale of ['ru', 'en', 'uk', 'kk', 'es', 'fr']) {
  assert.equal(ai.localeCoverage[locale].availability, 'candidate');
  assert.equal(ai.localeCoverage[locale].contentQa, 'not_run');
}

// No machine-local path, secret or accidental deployment detail belongs in a
// public-auditable evidence object. Evidence references are stable logical IDs.
const serialized = JSON.stringify(EVIDENCE);
for (const forbidden of ['/Users/', '/private/', 'DIRECTUS_', 'DATABASE_URL', 'TOKEN=', 'railway.app']) {
  assert.equal(serialized.includes(forbidden), false, `evidence leaks forbidden value ${forbidden}`);
}

assert.ok(Object.isFrozen(EVIDENCE));
assert.ok(Object.isFrozen(EVIDENCE.sourceGroups));
assert.ok(Object.isFrozen(EVIDENCE.sourceGroups[0].localeCoverage.ru));
assert.throws(() => { EVIDENCE.localePolicy.launchLocales.push('ru'); }, TypeError);
assert.throws(() => { EVIDENCE.sourceGroups[0].rights.status = 'formally_cleared'; }, TypeError);
assert.throws(() => { EVIDENCE.sourceGroups[0].localeCoverage.ru.fallback = 'en'; }, TypeError);

const localeRows = EVIDENCE.sourceGroups.length * EXPECTED_LOCALES.length;
const failedQa = EVIDENCE.sourceGroups.flatMap((group) => EXPECTED_LOCALES
  .filter((locale) => group.localeCoverage[locale].contentQa === 'failed')
  .map((locale) => `${group.id}/${locale}`));
const unavailable = EVIDENCE.sourceGroups.flatMap((group) => EXPECTED_LOCALES
  .filter((locale) => group.localeCoverage[locale].availability === 'unavailable')
  .map((locale) => `${group.id}/${locale}`));

console.log(`BTC content evidence (${EVIDENCE.evidenceId}): OK`);
console.log(`  courses=${assignedCourses.length}; source-groups=${EVIDENCE.sourceGroups.length}; locale-records=${localeRows}`);
console.log(`  Content QA blocked=${failedQa.join(', ') || 'none'}`);
console.log(`  unavailable=${unavailable.join(', ') || 'none'}`);
console.log('  rights=owner-attested internal origin; formal clearance deferred');
console.log('  first-launch locale=en; fallback=en with visible notice and no mixed-language body');
console.log('OWNER_DECISION_REQUIRED: 95D');
