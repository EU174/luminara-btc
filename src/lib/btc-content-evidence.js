// Issue #95 / chunk 95D — reviewable localization and rights evidence for BTC.
//
// This is an inventory, not a grant of permission and not a launch decision.
// A package being present or structurally complete does not prove editorial
// approval, copyright clearance, attribution completeness or nonprofit reuse.
// Those dimensions remain separate and fail closed below.

/** Recursively freeze plain data so no request or caller can widen evidence. */
function deepFreeze(value) {
  if (value === null || typeof value !== 'object') return value;
  for (const key of Object.getOwnPropertyNames(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}

export const BTC_CONTENT_EVIDENCE_ID = 'luminara_btc_content_evidence_v1';
export const BTC_CONTENT_EVIDENCE_VERSION = 1;
export const BTC_CONTENT_LOCALES = deepFreeze(['ru', 'en', 'uk', 'kk', 'uz', 'es', 'fr', 'hy']);

const FOUNDATION_COURSES = [
  'preinternet', 'web1', 'web2', 'social', 'web30', 'web3', 'economy',
  'netocracy', 'kripto-yasli', 'kripto-azbuka',
];

const rightsOwnerAttested = (residualRisk) => ({
  status: 'owner_attested_internal_origin',
  rightsBasis: 'created_by_luminara_team_with_ai_assistance',
  licenseId: null,
  rightsHolderClaim: 'Luminara project team (unincorporated)',
  legalEntityStatus: 'not_registered',
  attribution: ['Created by the Luminara project team with AI assistance.'],
  nonprofitReuse: 'owner_approved',
  formalClearance: 'deferred_by_owner',
  knownThirdPartyCopying: 'none_declared_by_owner',
  evidenceRefs: ['owner-decision:2026-08-16'],
  residualRisk,
});

const reviewUnverified = () => ({
  status: 'unverified',
  owner: null,
  reviewedAt: null,
  safetyReview: 'unverified',
  regionalReview: 'unverified',
});

const localeEvidence = ({
  availability,
  unitsPresent = null,
  unitsExpected = null,
  contentQa = 'not_run',
  fallback = 'none',
  evidenceRef,
}) => ({
  availability,
  unitsPresent,
  unitsExpected,
  contentQa,
  editorialReview: 'unverified',
  launchEligible: false,
  fallback,
  evidenceRef,
});

const fallbackFor = (locale) => locale === 'en' ? 'none' : 'en_with_visible_notice';

const localeMap = (factory) => Object.fromEntries(
  BTC_CONTENT_LOCALES.map((locale) => [locale, factory(locale)]),
);

const unverifiedRuntimeCoverage = localeMap((locale) => localeEvidence({
  availability: 'unverified',
  fallback: fallbackFor(locale),
  evidenceRef: `live-cms-inventory-required:${locale}`,
}));

const netocracyCoverage = localeMap((locale) => localeEvidence({
  availability: 'candidate',
  unitsPresent: 25,
  unitsExpected: 25,
  contentQa: 'passed',
  fallback: fallbackFor(locale),
  evidenceRef: `netocracy-v108.9:dry-run:${locale}:25/25`,
}));

const bitcoinQaFailures = new Set(['ru', 'hy']);
const bitcoinCoverage = localeMap((locale) => localeEvidence({
  availability: 'candidate',
  unitsPresent: 12,
  unitsExpected: 12,
  contentQa: bitcoinQaFailures.has(locale) ? 'failed' : 'passed',
  fallback: fallbackFor(locale),
  evidenceRef: `bitcoin-atlas-v106.4:file-inventory:${locale}:12/12`,
}));

const tradingQaFailures = new Set(['ru', 'uk', 'kk', 'uz', 'hy']);
const tradingCoverage = localeMap((locale) => localeEvidence({
  availability: 'candidate',
  unitsPresent: 31,
  unitsExpected: 31,
  contentQa: tradingQaFailures.has(locale) ? 'failed' : 'passed',
  fallback: fallbackFor(locale),
  evidenceRef: `trading-corrected-v2:file-inventory:${locale}:31/31`,
}));

const aiCandidateLocales = new Set(['ru', 'en', 'uk', 'kk', 'es', 'fr']);
const aiCoverage = localeMap((locale) => localeEvidence({
  availability: aiCandidateLocales.has(locale) ? 'candidate' : 'unavailable',
  unitsPresent: aiCandidateLocales.has(locale) ? 26 : 0,
  unitsExpected: 26,
  contentQa: 'not_run',
  fallback: fallbackFor(locale),
  evidenceRef: aiCandidateLocales.has(locale)
    ? `ai-i18n-source-packages:file-inventory:${locale}:26/26`
    : `ai-i18n-source-packages:missing:${locale}`,
}));

const SOURCE_GROUPS = [
  {
    id: 'foundation-courses-live-cms',
    courseIds: FOUNDATION_COURSES,
    provenance: 'live_cms_not_exported_for_95d',
    packageAudit: {
      status: 'unverified',
      evidenceRef: 'repository-does-not-contain-authoritative-course-bodies',
      note: 'Interface metadata is not proof of complete localized course bodies.',
    },
    localeCoverage: unverifiedRuntimeCoverage,
    rights: rightsOwnerAttested('The authoritative CMS bodies were not exported, so the owner attestation could not be checked against the actual text.'),
    review: reviewUnverified(),
  },
  {
    id: 'netocracy-book-v108-9',
    courseIds: ['netocracy-book'],
    provenance: 'external_content_package',
    packageAudit: {
      status: 'structurally_valid',
      evidenceRef: 'sync-course-content:netocracy:dry-run',
      note: 'Importer dry-run passed with 25/25 units in every requested locale.',
    },
    localeCoverage: netocracyCoverage,
    rights: rightsOwnerAttested('The course discusses a third-party book; direct quotations and source references still require editorial verification before launch.'),
    review: reviewUnverified(),
  },
  {
    id: 'bitcoin-atlas-v106-4',
    courseIds: ['bitcoin-atlas'],
    provenance: 'external_content_package',
    packageAudit: {
      status: 'blocked_content_qa',
      evidenceRef: 'sync-course-content:bitcoin-atlas:dry-run',
      note: 'All 12 files exist per locale; current Content QA reports mixed-script defects in ru and hy.',
    },
    localeCoverage: bitcoinCoverage,
    rights: rightsOwnerAttested('Source citations remain third-party references and must not be presented as endorsements.'),
    review: reviewUnverified(),
  },
  {
    id: 'ai-course-source-packages-v1',
    courseIds: ['ai'],
    provenance: 'external_content_packages_not_normalized',
    packageAudit: {
      status: 'incomplete_locale_set',
      evidenceRef: 'ai-course-i18n-source-package-inventory',
      note: 'Candidate packages exist for ru/en/uk/kk/es/fr; uz and hy are unavailable and no normalized importer dry-run passed.',
    },
    localeCoverage: aiCoverage,
    rights: rightsOwnerAttested('AI output may be non-unique; factual and source review remains separate from the owner origin attestation.'),
    review: reviewUnverified(),
  },
  {
    id: 'trading-corrected-v2',
    courseIds: ['trading'],
    provenance: 'external_content_package',
    packageAudit: {
      status: 'blocked_content_qa',
      evidenceRef: 'sync-trading-content:dry-run',
      note: 'All 31 files exist per locale; current Content QA reports mixed-script defects in ru, uk, kk, uz and hy.',
    },
    localeCoverage: tradingCoverage,
    rights: rightsOwnerAttested('AI output may be non-unique; factual and source review remains separate from the owner origin attestation.'),
    review: reviewUnverified(),
  },
];

export const BTC_CONTENT_EVIDENCE = deepFreeze({
  evidenceId: BTC_CONTENT_EVIDENCE_ID,
  version: BTC_CONTENT_EVIDENCE_VERSION,
  siteProfile: 'luminara_btc',
  auditedAt: '2026-08-16',
  requestedLocales: [...BTC_CONTENT_LOCALES],
  localePolicy: {
    primaryLocale: 'en',
    launchLocales: ['en'],
    fallbackLocale: 'en',
    fallbackPolicy: 'explicit_full_document_with_visible_notice',
    preserveRequestedLocale: true,
    status: 'owner_approved_initial_policy',
    reason: 'English is the first-launch language. A missing translation falls back to the complete English document with a visible notice, never silent mixed-language content.',
  },
  publicationPolicy: {
    status: 'blocked',
    thirdPartyMaterial: 'do_not_copy_unreviewed_third_party_material',
    formalRightsClearance: 'deferred_by_owner',
    requiredForLaunch: [
      'locale_coverage_verified',
      'content_qa_passed',
      'editorial_owner_assigned',
      'owner_origin_attestation_recorded',
      'attribution_displayed',
    ],
  },
  sourceGroups: SOURCE_GROUPS,
});

/** Ordered course-to-group map for parity checks and operator tooling. */
export const BTC_CONTENT_COURSE_EVIDENCE = deepFreeze(Object.fromEntries(
  SOURCE_GROUPS.flatMap((group) => group.courseIds.map((courseId) => [courseId, group.id])),
));
