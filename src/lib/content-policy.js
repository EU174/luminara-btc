import {
  BTC_CONTENT_MANIFEST, isApprovedCourseId, publicManifestView, sectionForCourseId,
} from './btc-content-manifest.js';

const REGISTERED = new WeakSet();
export const BTC_CONTENT_POLICY = Object.freeze({
  siteProfile: 'luminara_btc',
  policyId: BTC_CONTENT_MANIFEST.manifestId,
  policyVersion: BTC_CONTENT_MANIFEST.version,
  cacheNamespace: `luminara_btc|${BTC_CONTENT_MANIFEST.manifestId}|v${BTC_CONTENT_MANIFEST.version}`,
  enforceManifest: true,
  requirePublished: true,
  manifestView: publicManifestView(),
});
REGISTERED.add(BTC_CONTENT_POLICY);

export function resolveContentPolicy() {
  return BTC_CONTENT_POLICY;
}

export function assertContentPolicy(policy) {
  if (!REGISTERED.has(policy)) throw new Error('registered BTC content policy required');
  return policy;
}

export function allowsCourse(policy, courseId) {
  assertContentPolicy(policy);
  return typeof courseId === 'string' && isApprovedCourseId(courseId);
}

export function mediaOwnerCourse(policy, mediaKey, retainedScenes = []) {
  assertContentPolicy(policy);
  if (typeof mediaKey !== 'string' || !mediaKey) return null;
  if (mediaKey.startsWith('scene:')) {
    const scene = retainedScenes.find((row) => row?.ck === mediaKey.slice(6));
    return scene && allowsCourse(policy, scene.topic_key) ? scene.topic_key : null;
  }
  const owner = mediaKey.startsWith('course:') ? mediaKey.slice(7) : mediaKey;
  return allowsCourse(policy, owner) ? owner : null;
}

export function manifestOrder(policy, rows, idOf) {
  assertContentPolicy(policy);
  const order = new Map();
  for (const section of policy.manifestView.sections) {
    for (const course of section.courses) order.set(course.id, order.size);
  }
  return dedupeById(rows.filter((row) => order.has(idOf(row))), idOf)
    .sort((a, b) => order.get(idOf(a)) - order.get(idOf(b)));
}

export function isPublishedRow(policy, row) {
  assertContentPolicy(policy);
  return row?.status === 'published';
}

export function manifestSectionFor(policy, courseId) {
  assertContentPolicy(policy);
  return sectionForCourseId(courseId);
}

export function dedupeById(rows, idOf) {
  const groups = new Map();
  for (const row of rows) {
    const id = idOf(row);
    if (typeof id !== 'string' || !id) continue;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(row);
  }
  const output = [];
  for (const group of groups.values()) {
    const first = JSON.stringify(group[0]);
    if (group.every((row) => JSON.stringify(row) === first)) output.push(group[0]);
  }
  return output;
}

export function selectUnique(rows, idOf) {
  if (!Array.isArray(rows) || rows.length !== 1) return null;
  const id = idOf(rows[0]);
  return typeof id === 'string' && id ? rows[0] : null;
}
