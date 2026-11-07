import {
  BTC_CONTENT_MANIFEST, isApprovedCourseId, publicManifestView, sectionForCourseId,
  courseIdForTopic, isApprovedScene, isExcludedSceneKey,
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

export function allowsTopic(policy, topic) {
  assertContentPolicy(policy);
  return courseIdForTopic(topic) !== null;
}

export function allowsScene(policy, scene) {
  assertContentPolicy(policy);
  return !!scene && isApprovedScene(scene.ck, scene.topic_key);
}

export function allowsSceneKey(policy, ck) {
  assertContentPolicy(policy);
  return typeof ck === 'string' && !!ck && !isExcludedSceneKey(ck);
}

// OS-0 changes only visibility/attachment, never the stored question copy.
export function visibleQuizQuestion(policy, question) {
  assertContentPolicy(policy);
  if (!question || !allowsTopic(policy, question.topic_key) || question.id === 'economy:q03') return null;
  const relocate = question.topic_key === 'economy' && ['economy:q01', 'economy:q02'].includes(question.id);
  const row = relocate ? { ...question, scene_ck: 'economy:4' } : question;
  return !row.scene_ck || isApprovedScene(row.scene_ck, row.topic_key) ? row : null;
}

export function mediaOwnerCourse(policy, mediaKey, retainedScenes = []) {
  assertContentPolicy(policy);
  if (typeof mediaKey !== 'string' || !mediaKey) return null;
  if (mediaKey.startsWith('scene:')) {
    const scene = retainedScenes.find((row) => row?.ck === mediaKey.slice(6));
    return scene && allowsScene(policy, scene) ? scene.topic_key : null;
  }
  const owner = mediaKey.startsWith('course:') ? mediaKey.slice(7) : mediaKey;
  return allowsTopic(policy, owner) ? owner : null;
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
  return sectionForCourseId(courseIdForTopic(courseId));
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
