// Canonical navigation titles for authored courses.
//
// Lesson bodies may deliberately use a narrative H1 that differs from the
// catalogue name.  The lesson title shown in navigation, deep links and the
// reader must nevertheless describe the same lesson in every locale.  Keeping
// that small, stable catalogue here prevents an import of editorial prose from
// silently renaming a route when the UI language changes.

const AI_TITLES = {
  ru: [
    'Введение: зачем Luminara разобрала AI?',
    'История AI: от Тьюринга и Дартмута до ChatGPT',
    'Что такое нейросеть простыми словами',
    'Машинное обучение, глубокое обучение и генеративный ИИ: в чём разница',
    'Большие языковые модели (LLM): как AI «думает» — принцип',
    'ChatGPT: история OpenAI, сильные стороны, как использовать',
    'Gemini: история Google DeepMind, сильные стороны, как использовать',
    'Claude: история Anthropic, сильные стороны, как использовать',
    'Kimi K3: история Moonshot AI, open-source и китайский AI',
    'Промпт-инжиниринг: как разговаривать с AI',
    'AI для текста: письмо, саммари, редактура',
    'AI для изображений и видео: Midjourney, DALL·E, Sora',
    'AI для данных: анализ, таблицы, визуализация',
    'AI-агенты и автоматизация',
    'No-code: создание приложений с AI (vibe coding)',
    'Этика AI: bias, приватность, дипфейки',
    'Галлюцинации и надёжность',
    'AI и рынок труда',
    'Контент-завод: как AI создаёт фабрику контента для нетократии и креативной экономики',
    'AI × Web3: нейросети, крипто и блокчейн — AI-агенты с кошельками, ончейн-оракулы, торговые боты, риски (дипфейк-скамы, фейковые токены)',
    'AI в бизнесе: маркетинг и финансы',
    'AI в медицине: кейс Harvard',
    'Авторское право и AI',
    'Регулирование AI: EU AI Act',
    'Как выбрать свой путь дальше',
    'Итог курса — возврат к вопросу урока 00',
  ],
  en: [
    'Introduction: why Luminara unpacked AI',
    'The history of AI: from Turing and Dartmouth to ChatGPT',
    'What is a neural network, in plain language',
    'Machine Learning vs Deep Learning vs Generative AI',
    'Large language models (LLMs): how AI “thinks” — the principle',
    'ChatGPT: OpenAI’s story, strengths and how to use it',
    'Gemini: Google DeepMind’s story, strengths and how to use it',
    'Claude: Anthropic’s story, strengths and how to use it',
    'Kimi K3: Moonshot AI, open source and Chinese AI',
    'Prompt engineering: how to talk to AI',
    'AI for text: writing, summaries and editing',
    'AI for images and video: Midjourney, DALL·E, Sora',
    'AI for data: analysis, spreadsheets and visualization',
    'AI agents and automation',
    'No-code: building applications with AI (vibe coding)',
    'AI ethics: bias, privacy and deepfakes',
    'Hallucinations and reliability',
    'AI and the labour market',
    'Content factory: how AI builds a content engine for netocracy and the creative economy',
    'AI × Web3: neural networks, crypto and blockchain — AI agents with wallets, on-chain oracles, trading bots, risks (deepfake scams, fake tokens)',
    'AI in business: marketing and finance',
    'AI in medicine: Harvard case study',
    'Copyright and AI',
    'AI regulation: the EU AI Act',
    'How to choose your own path forward',
    'Course conclusion — returning to the question from lesson 00',
  ],
};

export function canonicalCourseTitle(topicKey, sort, fallback) {
  if (topicKey !== 'ai' || !Number.isInteger(Number(sort))) return fallback || {};
  const index = Number(sort);
  if (index < 0 || index >= AI_TITLES.ru.length) return fallback || {};
  return { ru: AI_TITLES.ru[index], en: AI_TITLES.en[index] };
}

export { AI_TITLES };
