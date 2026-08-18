import { canonicalCourseTitle } from '../lib/course-catalog.js';
import { mergeCatalogTitle } from '../lib/locale-resolve.js';
import {
  allowsCourse, assertContentPolicy, dedupeById, isPublishedRow, manifestOrder,
  manifestSectionFor, mediaOwnerCourse, selectUnique,
} from '../lib/content-policy.js';

const TTL_MS = 60_000;
const cache = new Map();
const SCENE_FIELDS = 'ck,topic_key,sort,title,body,insight,tags,status,access,media,sources,terms';
const READING_LEVELS = new Set(['deep', 'academic']);

function directusConfig() {
  const base = String(process.env.DIRECTUS_URL || '').replace(/\/+$/, '');
  const token = String(process.env.DIRECTUS_TOKEN || '');
  return base && token ? { base, token } : null;
}

async function directusGet(path) {
  const config = directusConfig();
  if (!config) {
    const error = new Error('directus_not_configured');
    error.code = 503;
    throw error;
  }
  const response = await fetch(config.base + path, {
    headers: { Authorization: `Bearer ${config.token}`, Accept: 'application/json' },
  });
  if (!response.ok) {
    const error = new Error(`directus_http_${response.status}`);
    error.code = 502;
    throw error;
  }
  return (await response.json())?.data;
}

async function directusList(path, pageSize = 100, maxPages = 100) {
  const output = [];
  const separator = path.includes('?') ? '&' : '?';
  for (let page = 1; page <= maxPages; page += 1) {
    const rows = (await directusGet(`${path}${separator}limit=${pageSize}&page=${page}`)) || [];
    output.push(...rows);
    if (rows.length < pageSize) return output;
  }
  const error = new Error('directus_page_limit');
  error.code = 502;
  throw error;
}

function key(policy, name) {
  assertContentPolicy(policy);
  return `${policy.cacheNamespace}|${name}`;
}
function cached(policy, name) {
  const value = cache.get(key(policy, name));
  return value && Date.now() - value.at < TTL_MS ? value.data : null;
}
function store(policy, name, data) {
  cache.set(key(policy, name), { at: Date.now(), data });
  return data;
}

async function sceneByKey(policy, ck) {
  const hit = cached(policy, `scene:${ck}`);
  if (hit !== null) return hit;
  const rows = await directusList(`/items/lum_scenes?fields=${SCENE_FIELDS}`);
  const scene = selectUnique(
    rows.filter((row) => row?.ck === ck && isPublishedRow(policy, row)),
    (row) => row.ck,
  );
  return store(policy, `scene:${ck}`, scene);
}

async function scenesByTopic(policy, topic) {
  const hit = cached(policy, `topic:${topic}`);
  if (hit !== null) return hit;
  const rows = await directusList(`/items/lum_scenes?fields=${SCENE_FIELDS}`);
  const scenes = dedupeById(
    rows.filter((row) => row?.topic_key === topic
      && allowsCourse(policy, row.topic_key)
      && isPublishedRow(policy, row)),
    (row) => row.ck,
  ).sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0)
    || String(a.ck || '').localeCompare(String(b.ck || '')));
  return store(policy, `topic:${topic}`, scenes);
}

function isLeveledBody(body) {
  return Boolean(body && typeof body === 'object' && !Array.isArray(body)
    && ['simple', 'extended', ...READING_LEVELS].some((level) => level in body));
}

function availableLevels(body) {
  if (!isLeveledBody(body)) return [];
  return [...READING_LEVELS].filter((level) => {
    const value = body[level];
    return value && typeof value === 'object' && !Array.isArray(value);
  });
}

function baseBody(body) {
  if (!isLeveledBody(body)) return body || {};
  const output = { ...body };
  for (const level of READING_LEVELS) delete output[level];
  return output;
}

function sceneMeta(scene) {
  const canonical = canonicalCourseTitle(scene.topic_key, scene.sort, scene.title || {});
  return {
    ck: scene.ck,
    topic_key: scene.topic_key,
    sort: scene.sort,
    title: mergeCatalogTitle(canonical, scene.title || {}),
    tags: scene.tags || [],
    status: scene.status,
    access: 'free',
    available_levels: availableLevels(scene.body),
  };
}

function sceneFull(policy, scene) {
  return {
    ...sceneMeta(scene),
    body: baseBody(scene.body),
    insight: scene.insight || {},
    media: scene.media || null,
    sources: Array.isArray(scene.sources) ? scene.sources : [],
    slug: scene.slug || '',
    terms: Array.isArray(scene.terms) ? scene.terms : [],
    section_key: manifestSectionFor(policy, scene.topic_key),
    locked: false,
  };
}

async function topicMedia(policy, scene) {
  const rows = await directusList('/items/lum_topic_media?fields=topic_key,video,live_demo');
  for (const mediaKey of [`scene:${scene.ck}`, `course:${scene.topic_key}`]) {
    const row = selectUnique(rows.filter((candidate) => candidate?.topic_key === mediaKey),
      (candidate) => candidate.topic_key);
    if (row && mediaOwnerCourse(policy, mediaKey, [scene]) === scene.topic_key) return row;
  }
  return null;
}

async function bootstrap(policy) {
  const hit = cached(policy, 'bootstrap');
  if (hit !== null) return hit;
  const [topics, scenes, media] = await Promise.all([
    directusList('/items/lum_topics?fields=key,ecosystem,title,color,blurb,insight_prompt,peer_insight,extra,sort,status'),
    directusList(`/items/lum_scenes?fields=${SCENE_FIELDS}`).catch(() => []),
    directusList('/items/lum_topic_media?fields=topic_key,video,live_demo').catch(() => []),
  ]);
  const retainedTopics = manifestOrder(
    policy,
    topics.filter((row) => row && allowsCourse(policy, row.key) && isPublishedRow(policy, row)),
    (row) => row.key,
  ).map((row) => ({
    ...row,
    ecosystem: manifestSectionFor(policy, row.key),
    section_key: manifestSectionFor(policy, row.key),
    access: 'free',
  }));
  const retainedScenes = dedupeById(
    scenes.filter((row) => row && allowsCourse(policy, row.topic_key) && isPublishedRow(policy, row)),
    (row) => row.ck,
  ).sort((a, b) => String(a.topic_key).localeCompare(String(b.topic_key))
    || Number(a.sort || 0) - Number(b.sort || 0)
    || String(a.ck || '').localeCompare(String(b.ck || '')));
  const owners = new Set([
    ...retainedTopics.map((row) => row.key),
    ...retainedScenes.map((row) => row.topic_key),
  ]);
  return store(policy, 'bootstrap', {
    manifest: policy.manifestView,
    topics: retainedTopics,
    scenes: retainedScenes.map((scene) => sceneFull(policy, scene)),
    weeks: [],
    media: dedupeById(
      media.filter((row) => {
        const owner = mediaOwnerCourse(policy, row?.topic_key, retainedScenes);
        return Boolean(owner && owners.has(owner));
      }),
      (row) => row.topic_key,
    ),
  });
}

function publicCache(reply) {
  reply.header('Cache-Control', 'public, max-age=60');
  reply.removeHeader('Vary');
}

function rejectBulk(req, reply) {
  if (req.query?.limit == null) return false;
  const limit = Number(req.query.limit);
  if (Number.isInteger(limit) && limit >= 1 && limit <= 50) return false;
  reply.code(400).send({ error: 'invalid_limit', max: 50 });
  return true;
}

export default async function contentRoutes(app, opts = {}) {
  const policy = assertContentPolicy(opts.policy);
  app.get('/api/v1/content/bootstrap', async (req, reply) => {
    if (rejectBulk(req, reply)) return;
    try {
      publicCache(reply);
      return await bootstrap(policy);
    } catch (error) {
      return reply.code(error.code === 503 ? 503 : 502)
        .send({ error: error.message || 'content_unavailable' });
    }
  });

  app.get('/api/v1/content/scene/:ck/level/:level', async (req, reply) => {
    const ck = String(req.params?.ck || '').slice(0, 80);
    const level = String(req.params?.level || '').toLowerCase();
    if (!ck) return reply.code(400).send({ error: 'ck_required' });
    if (!READING_LEVELS.has(level)) return reply.code(400).send({ error: 'invalid_level' });
    let scene;
    try { scene = await sceneByKey(policy, ck); } catch (error) {
      return reply.code(error.code === 503 ? 503 : 502)
        .send({ error: error.message || 'content_unavailable' });
    }
    if (!scene || !allowsCourse(policy, scene.topic_key)) {
      return reply.code(404).send({ error: 'scene_not_found' });
    }
    const body = isLeveledBody(scene.body) ? scene.body[level] : null;
    if (!body || typeof body !== 'object') return reply.code(404).send({ error: 'level_not_found' });
    publicCache(reply);
    return { ck, level, locked: false, body };
  });

  app.get('/api/v1/content/scene/:ck', async (req, reply) => {
    const ck = String(req.params?.ck || '').slice(0, 80);
    if (!ck) return reply.code(400).send({ error: 'ck_required' });
    let scene;
    try { scene = await sceneByKey(policy, ck); } catch (error) {
      return reply.code(error.code === 503 ? 503 : 502)
        .send({ error: error.message || 'content_unavailable' });
    }
    if (!scene || !allowsCourse(policy, scene.topic_key)) {
      return reply.code(404).send({ error: 'scene_not_found' });
    }
    publicCache(reply);
    let media = null;
    try { media = await topicMedia(policy, scene); } catch {}
    return { ck, access: 'free', locked: false, scene: sceneFull(policy, scene), topic_media: media };
  });

  app.get('/api/v1/content/topic/:key', async (req, reply) => {
    if (rejectBulk(req, reply)) return;
    const topic = String(req.params?.key || '').slice(0, 60);
    if (!topic) return reply.code(400).send({ error: 'topic_required' });
    if (!allowsCourse(policy, topic)) return reply.code(404).send({ error: 'topic_not_found' });
    let scenes;
    try { scenes = await scenesByTopic(policy, topic); } catch (error) {
      return reply.code(error.code === 503 ? 503 : 502)
        .send({ error: error.message || 'content_unavailable' });
    }
    publicCache(reply);
    return {
      topic_key: topic,
      section_key: manifestSectionFor(policy, topic),
      scenes: scenes.map((scene) => ({
        ...sceneMeta(scene),
        section_key: manifestSectionFor(policy, scene.topic_key),
        locked: false,
      })),
    };
  });
}
