import { z } from 'zod';
import { requireFreshAuth, freshAuth } from '../lib/middleware.js';
import { query } from '../lib/db.js';
import { assembleQuizCatalog } from '../lib/quiz-catalog.js';
import {
  allowsCourse, assertContentPolicy, dedupeById, isPublishedRow, manifestSectionFor,
} from '../lib/content-policy.js';

const COLLECTION = 'lum_quiz_questions';
const TTL_MS = 60_000;
const cache = new Map();
const QUESTION_FIELDS = 'id,topic_key,scene_ck,node_id,prompt,options,status,sort';
const QUIZ_POLICY = Object.freeze({
  scoring: 'best',
  retake: true,
  completion: 'all_answered',
});

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
async function fetchAll(path, fields) {
  const rows = [];
  for (let page = 1; page <= 100; page += 1) {
    const joiner = path.includes('?') ? '&' : '?';
    const batch = (await directusGet(
      `${path}${joiner}limit=100&page=${page}&fields=${fields}`,
    )) || [];
    rows.push(...batch);
    if (batch.length < 100) return rows;
  }
  const error = new Error('directus_page_limit');
  error.code = 502;
  throw error;
}

function cacheKey(policy, value) {
  assertContentPolicy(policy);
  return `${policy.cacheNamespace}|${value}`;
}
function cached(policy, value) {
  const item = cache.get(cacheKey(policy, value));
  return item && Date.now() - item.at < TTL_MS ? item.data : null;
}
function store(policy, value, data) {
  cache.set(cacheKey(policy, value), { at: Date.now(), data });
  return data;
}
function options(raw) {
  let value = raw;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { value = []; }
  }
  return Array.isArray(value) ? value : [];
}
function publicQuestion(policy, question) {
  const node = question.node_id || '';
  return {
    id: question.id,
    topic_key: question.topic_key,
    scene_ck: question.scene_ck || '',
    node_id: allowsCourse(policy, node) ? node : '',
    prompt: question.prompt || {},
    options: options(question.options).map((item) => ({ id: item.id, text: item.text || {} })),
  };
}

async function byTopic(policy, topic) {
  const hit = cached(policy, `topic:${topic}`);
  if (hit) return hit;
  const rows = await fetchAll(`/items/${COLLECTION}`, QUESTION_FIELDS);
  const retained = dedupeById(
    rows.filter((row) => row?.topic_key === topic
      && allowsCourse(policy, row.topic_key)
      && isPublishedRow(policy, row)),
    (row) => String(row.id),
  ).sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0)
    || String(a.id).localeCompare(String(b.id)));
  return store(policy, `topic:${topic}`, retained);
}

async function byId(policy, id) {
  const hit = cached(policy, `id:${id}`);
  if (hit) return hit;
  const rows = await fetchAll(`/items/${COLLECTION}`, `${QUESTION_FIELDS},why`);
  const exact = rows.filter((row) => String(row?.id) === String(id)
    && isPublishedRow(policy, row));
  return store(policy, `id:${id}`, exact.length === 1 ? exact[0] : null);
}

async function catalog(policy) {
  const hit = cached(policy, 'catalog');
  if (hit) return hit;
  const [questions, topics, scenes] = await Promise.all([
    fetchAll(`/items/${COLLECTION}`, 'id,topic_key,node_id,status'),
    fetchAll('/items/lum_topics', 'key,status,title,ecosystem'),
    fetchAll('/items/lum_scenes', 'topic_key,access,status,ck'),
  ]);
  const retained = assembleQuizCatalog({
    questions: dedupeById(
      questions.filter((row) => row && allowsCourse(policy, row.topic_key)
        && isPublishedRow(policy, row)),
      (row) => String(row.id),
    ),
    topics: dedupeById(
      topics.filter((row) => row && allowsCourse(policy, row.key)
        && isPublishedRow(policy, row)),
      (row) => row.key,
    ),
    scenes: dedupeById(
      scenes.filter((row) => row && allowsCourse(policy, row.topic_key)
        && isPublishedRow(policy, row)),
      (row) => row.ck,
    ),
  }).filter((item) => allowsCourse(policy, item?.topic_key))
    .map((item) => ({
      ...item,
      section_key: manifestSectionFor(policy, item.topic_key),
      access: 'free',
    }));
  return store(policy, 'catalog', dedupeById(retained, (item) => item.topic_key));
}

async function viewer(req) {
  try {
    const auth = await freshAuth(req);
    return auth?.sub || null;
  } catch {
    return null;
  }
}

export default async function quizRoutes(app, opts = {}) {
  const policy = assertContentPolicy(opts.policy);

  app.get('/api/v1/quiz/catalog', async (req, reply) => {
    reply.header('Cache-Control', 'private, no-store, max-age=0');
    let items;
    try { items = await catalog(policy); } catch (error) {
      return reply.code(error.code === 503 ? 503 : 502)
        .send({ error: error.message || 'quiz_catalog_unavailable' });
    }
    const userId = await viewer(req);
    let stats = new Map();
    if (userId && items.length) {
      const { rows } = await query(
        `SELECT topic_key,COUNT(*)::int AS answered,
                COUNT(*) FILTER (WHERE correct)::int AS correct
         FROM quiz_attempts WHERE user_id=$1 AND topic_key=ANY($2::text[])
         GROUP BY topic_key`,
        [userId, items.map((item) => item.topic_key)],
      );
      stats = new Map(rows.map((row) => [
        row.topic_key,
        { answered: Number(row.answered), correct: Number(row.correct) },
      ]));
    }
    return {
      quizzes: items.map((item) => ({
        ...item,
        access: 'free',
        locked: false,
        stats: stats.get(item.topic_key) || { answered: 0, correct: 0 },
      })),
      total: items.length,
      viewer: { authenticated: Boolean(userId) },
    };
  });

  app.get('/api/v1/quiz', async (req, reply) => {
    const topic = String(req.query?.topic || '').slice(0, 60);
    if (!topic) return reply.code(400).send({ error: 'topic_required' });
    if (!allowsCourse(policy, topic)) return reply.code(404).send({ error: 'quiz_not_found' });
    let questions;
    let item;
    try {
      [questions, item] = await Promise.all([
        byTopic(policy, topic),
        catalog(policy).then((rows) => rows.find((row) => row.topic_key === topic)),
      ]);
    } catch (error) {
      return reply.code(error.code === 503 ? 503 : 502)
        .send({ error: error.message || 'quiz_unavailable' });
    }
    if (!item || !questions.length) return reply.code(404).send({ error: 'quiz_not_found' });
    const publicQuestions = questions.map((question) => publicQuestion(policy, question));
    const output = {
      topic,
      questions: publicQuestions,
      total: publicQuestions.length,
      policy: QUIZ_POLICY,
      section_key: manifestSectionFor(policy, topic),
    };
    const userId = await viewer(req);
    if (userId) {
      const ids = publicQuestions.map((question) => String(question.id));
      const { rows } = ids.length
        ? await query(
          `SELECT question_id,correct FROM quiz_attempts
           WHERE user_id=$1 AND question_id=ANY($2::text[])`,
          [userId, ids],
        )
        : { rows: [] };
      output.attempts = Object.fromEntries(
        rows.map((row) => [String(row.question_id), { correct: Boolean(row.correct) }]),
      );
      output.answered = rows.length;
      output.correct = rows.filter((row) => row.correct).length;
    }
    return output;
  });

  app.post('/api/v1/quiz/answer', { preHandler: requireFreshAuth }, async (req, reply) => {
    const body = z.object({
      question_id: z.string().min(1).max(80),
      option_id: z.string().min(1).max(16),
    }).parse(req.body);
    let question;
    try { question = await byId(policy, body.question_id); } catch (error) {
      return reply.code(error.code === 503 ? 503 : 502)
        .send({ error: error.message || 'quiz_unavailable' });
    }
    if (!question || !allowsCourse(policy, question.topic_key)) {
      return reply.code(404).send({ error: 'question_not_found' });
    }
    const chosen = options(question.options)
      .find((option) => String(option.id) === body.option_id);
    if (!chosen) return reply.code(400).send({ error: 'invalid_option' });
    const correct = Boolean(chosen.is_correct);
    await query(
      `INSERT INTO quiz_attempts(user_id,question_id,topic_key,correct,answered_at)
       VALUES ($1,$2,$3,$4,now())
       ON CONFLICT (user_id,question_id) DO UPDATE SET
         correct=quiz_attempts.correct OR EXCLUDED.correct,
         answered_at=now()`,
      [req.auth.sub, String(question.id), question.topic_key, correct],
    );
    return { correct, why: question.why || {} };
  });
}
