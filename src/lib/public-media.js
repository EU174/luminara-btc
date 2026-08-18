// Public bootstrap media is intentionally narrower than the editor-facing
// `lum_topic_media` collection.  A topic-level record is safe only when no
// scene in that topic is paid.  A record scoped to one scene is safe only for
// that exact free scene.  This keeps a course's paid media from leaking through
// the public bootstrap while still supporting a free introductory lesson.
export const SCENE_MEDIA_PREFIX = 'scene:';

export function scopedSceneCk(mediaKey) {
  if (typeof mediaKey !== 'string' || !mediaKey.startsWith(SCENE_MEDIA_PREFIX)) return null;
  const ck = mediaKey.slice(SCENE_MEDIA_PREFIX.length);
  return ck || null;
}

export function isPublicBootstrapMedia(row, scenes) {
  if (!row || typeof row.topic_key !== 'string' || !row.topic_key) return false;
  const allScenes = Array.isArray(scenes) ? scenes : [];
  const scopedCk = scopedSceneCk(row.topic_key);
  if (scopedCk) {
    const scene = allScenes.find((candidate) => candidate && candidate.ck === scopedCk);
    // Do not publish a scoped record for a paid scene, even if that scene is a
    // teaser. Teaser access is owned by the scene endpoint; media bootstrap is
    // deliberately stricter and accepts only explicitly free scenes.
    return !!scene && scene.access !== 'paid';
  }
  return !allScenes.some((scene) => scene && scene.topic_key === row.topic_key && scene.access === 'paid');
}
