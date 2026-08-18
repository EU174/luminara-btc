import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const HERE = dirname(fileURLToPath(import.meta.url));
const GRAPH_PATH = join(HERE, '..', 'public', 'v62', 'content-graph.js');
const ACTIVATION_TOPIC = 'ecosystems-overview';

let staticMetadata;

// The browser content graph remains the canonical source for static Foundations
// titles. Execute it in a data-only sandbox instead of maintaining a second locale
// dictionary on the server (issue #79).
export function getStaticQuizMetadata() {
  if (staticMetadata) return staticMetadata;
  const window = { LUMINARA_EXTERNAL_THEMES: [] };
  vm.runInNewContext(readFileSync(GRAPH_PATH, 'utf8'), { window, console: { warn() {} } }, { filename: GRAPH_PATH });
  const data = window.LUMINARA_DATA || {};
  const foundations = new Map((data.CHAPTERS || []).map((chapter) => [chapter.key, chapter.title || {}]));
  const nodes = new Map((data.NODES || []).map((node) => [node.id, { title: node.title || {}, group: node.group || '' }]));
  staticMetadata = { foundations, nodes };
  return staticMetadata;
}

function safeTitle(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out = {};
  for (const [locale, title] of Object.entries(value)) {
    if (/^[a-z]{2}$/.test(locale) && typeof title === 'string' && title.trim()) out[locale] = title.trim();
  }
  return out;
}

function activationTitle() {
  return {
    en: 'Activation quiz', ru: 'Квиз для активации', uk: 'Квіз для активації',
    kk: 'Белсендіру квизі', uz: 'Faollashtirish kvizi', es: 'Quiz de activación',
    fr: "Quiz d’activation", hy: 'Ակտիվացման վիկտորինա',
  };
}

// Produces safe metadata only. Question text, choices, explanations and media are
// deliberately not accepted by the returned shape, so the catalogue cannot leak them.
export function assembleQuizCatalog({ questions = [], topics = [], scenes = [] } = {}) {
  const { foundations, nodes } = getStaticQuizMetadata();
  const topicMeta = new Map(topics.filter(Boolean).map((topic) => [String(topic.topic_key || topic.key || topic.id || ''), topic]));
  const accessByTopic = new Map();
  for (const scene of scenes) {
    const key = String(scene?.topic_key || '');
    if (!key) continue;
    const values = accessByTopic.get(key) || new Set();
    values.add(scene.access === 'paid' ? 'paid' : 'free');
    accessByTopic.set(key, values);
  }

  const grouped = new Map();
  for (const row of questions) {
    const key = String(row?.topic_key || '');
    if (!key) continue;
    const item = grouped.get(key) || { topic_key: key, question_count: 0, node_id: '' };
    item.question_count += 1;
    if (!item.node_id && row.node_id) item.node_id = String(row.node_id);
    grouped.set(key, item);
  }

  return [...grouped.values()].map((item) => {
    const meta = topicMeta.get(item.topic_key) || {};
    const chapterTitle = foundations.get(item.topic_key);
    const topicNode = nodes.get(item.topic_key);
    const questionNode = nodes.get(item.node_id);
    const directusTitle = safeTitle(meta.title);
    const title = Object.keys(directusTitle).length
      ? directusTitle
      : (chapterTitle || topicNode?.title || (item.topic_key === ACTIVATION_TOPIC ? activationTitle() : {}));
    const titleStatus = Object.keys(title).length ? 'canonical' : 'missing';
    const accessValues = accessByTopic.get(item.topic_key);
    // Fail closed when canonical scene metadata is absent or contradictory. The
    // activation quiz is the sole explicit public system exception.
    const access = item.topic_key === ACTIVATION_TOPIC
      ? 'free'
      : (accessValues && accessValues.size === 1 && accessValues.has('free') ? 'free' : 'paid');
    const sectionKey = foundations.has(item.topic_key)
      ? 'foundations'
      : String(meta.ecosystem || topicNode?.group || questionNode?.group || (item.topic_key === ACTIVATION_TOPIC ? 'activation' : 'research'));
    return {
      topic_key: item.topic_key,
      section_key: sectionKey,
      title,
      title_status: titleStatus,
      question_count: item.question_count,
      access,
      route: `#/quizzes?topic=${encodeURIComponent(item.topic_key)}`,
    };
  }).sort((a, b) => a.section_key.localeCompare(b.section_key) || a.topic_key.localeCompare(b.topic_key));
}
