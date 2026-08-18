// One normalized locale policy shared by the reader, content API and importer.
export const SUPPORTED_LOCALES = ['ru', 'en', 'uk', 'kk', 'uz', 'es', 'fr', 'hy'];

export const LOCALE_NATIVE_NAME = {
  ru: 'русский', en: 'English', uk: 'українська', kk: 'қазақша',
  uz: "o'zbek", es: 'español', fr: 'français', hy: 'հայերեն',
};

const FALLBACK_ORDER = ['en', 'ru'];
function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

// Always returns a renderable string and reports whether it came from fallback.
export function resolveLocale(map, requested) {
  const want = SUPPORTED_LOCALES.includes(requested) ? requested : 'en';
  if (typeof map === 'string') return { value: map, locale: want, fallback: false };
  if (!isPlainObject(map)) return { value: '', locale: '', fallback: false };
  if (typeof map[want] === 'string' && map[want].trim()) {
    return { value: map[want], locale: want, fallback: false };
  }
  for (const key of FALLBACK_ORDER) {
    if (key === want) continue;
    if (typeof map[key] === 'string' && map[key].trim()) {
      return { value: map[key], locale: key, fallback: true };
    }
  }
  return { value: '', locale: '', fallback: false };
}

export function resolveString(map, requested) {
  return resolveLocale(map, requested).value;
}

const NOTICE_TEMPLATES = {
  ru: (shown) => `Перевод на русский готовится. Сейчас доступна ${shown} версия.`,
  en: (shown) => `A ${shown} version is shown while this translation is being prepared.`,
  uk: (shown) => `Переклад українською готується. Зараз доступна ${shown} версія.`,
  kk: (shown) => `Қазақшаға аударма дайындалып жатыр. Қазір ${shown} нұсқасы қолжетімді.`,
  uz: (shown) => `O'zbekchaga tarjima tayyorlanmoqda. Hozircha ${shown} versiyasi mavjud.`,
  es: (shown) => `La traducción al español está en preparación. Por ahora se muestra la versión en ${shown}.`,
  fr: (shown) => `La traduction en français est en cours. La version en ${shown} est affichée pour le moment.`,
  hy: (shown) => `Հայերեն թարգմանությունը պատրաստվում է։ Այժմ հասանելի է ${shown} տարբերակը։`,
};

export function fallbackNotice(resolution, requested) {
  if (!resolution || !resolution.fallback || !resolution.value) return '';
  const want = SUPPORTED_LOCALES.includes(requested) ? requested : 'en';
  const shownName = LOCALE_NATIVE_NAME[resolution.locale] || resolution.locale;
  return (NOTICE_TEMPLATES[want] || NOTICE_TEMPLATES.en)(shownName);
}

// Preserve authored locale titles, but let canonical catalogue names win for RU/EN.
export function mergeCatalogTitle(canonical, directusTitle) {
  const out = {};
  if (isPlainObject(directusTitle)) {
    for (const locale of SUPPORTED_LOCALES) {
      if (typeof directusTitle[locale] === 'string' && directusTitle[locale].trim()) out[locale] = directusTitle[locale];
    }
  }
  if (isPlainObject(canonical)) {
    for (const locale of SUPPORTED_LOCALES) {
      if (typeof canonical[locale] === 'string' && canonical[locale].trim()) out[locale] = canonical[locale];
    }
  }
  return out;
}

// ── #95 (95D.1): whole-document locale resolution ────────────────────────────
// The legacy per-field resolver above stays exactly as main uses it. This is an
// explicit, additive, document-level API: the language decision is made ONCE for
// a displayed lesson/document, so a localized title can never sit above an
// English body, and no field is silently borrowed from another locale.
//
// Locale is a presentation preference here and nothing else. Nothing in this file
// reads a host, header, query, cookie, account attribute or content membership.

/** BTC shows exactly one fallback language: English. Russian is never a fallback. */
export const BTC_DOCUMENT_FALLBACK_LOCALES = Object.freeze(['en']);
/** Legacy/main documents keep the historical English-then-Russian order. */
export const LEGACY_DOCUMENT_FALLBACK_LOCALES = Object.freeze(['en', 'ru']);

// A bare string carries no provenance: it proves nothing about which locales were
// authored. Under `strictStrings` it is unavailable until normalized to a locale
// map by an audited upstream boundary.
function documentText(value, locale, strictStrings, anchor) {
  if (typeof value === 'string') {
    if (!strictStrings) return value;
    // A strict document cannot infer language provenance from a bare string.
    // Audited English must be normalized upstream as `{ en: value }`.
    return '';
  }
  if (!isPlainObject(value)) return '';
  const text = value[locale];
  return typeof text === 'string' ? text : '';
}

/**
 * Resolve one document in one locale.
 *
 * `fields` is a map of authored prose fields. `options.required` names the fields
 * that must be present for the document to count as complete in a locale — by
 * default just the body, because a title alone is never evidence that a
 * translation exists. Stable IDs, routes, progress keys and source URLs are not
 * passed here and are never translated.
 *
 * Returns `{ requestedLocale, documentLocale, fallback, available, fields, missing }`.
 * When `available` is false the caller must show a bounded unavailable state; it
 * must not fall through to another locale.
 */
export function resolveDocument(fields, requested, options = {}) {
  const want = SUPPORTED_LOCALES.includes(requested) ? requested : 'en';
  const fallbackLocales = Array.isArray(options.fallbackLocales)
    ? options.fallbackLocales : LEGACY_DOCUMENT_FALLBACK_LOCALES;
  const anchor = fallbackLocales[0] || 'en';
  const strictStrings = options.strictStrings === true;
  const required = Array.isArray(options.required) && options.required.length
    ? options.required : ['body'];
  const textOf = typeof options.textOf === 'function'
    ? (value, locale) => options.textOf(value, locale, { strictStrings, anchor })
    : (value, locale) => documentText(value, locale, strictStrings, anchor);
  const source = isPlainObject(fields) ? fields : {};
  const names = Object.keys(source);

  const isComplete = (locale) => required.every((name) => {
    const text = textOf(source[name], locale);
    return typeof text === 'string' && text.trim() !== '';
  });

  let documentLocale = '';
  for (const locale of [want, ...fallbackLocales]) {
    if (documentLocale) break;
    if (!SUPPORTED_LOCALES.includes(locale)) continue;
    if (isComplete(locale)) documentLocale = locale;
  }

  if (!documentLocale) {
    const empty = {};
    for (const name of names) empty[name] = '';
    return {
      requestedLocale: want, documentLocale: '', fallback: false,
      available: false, fields: empty, missing: names.slice(),
    };
  }

  // Every authored field comes from the ONE chosen document locale. A field that
  // is absent there stays empty; it is never borrowed from another language.
  const resolved = {};
  const missing = [];
  for (const name of names) {
    const text = textOf(source[name], documentLocale);
    const value = typeof text === 'string' ? text : '';
    resolved[name] = value.trim() ? value : '';
    if (!resolved[name]) missing.push(name);
  }
  return {
    requestedLocale: want,
    documentLocale,
    fallback: documentLocale !== want,
    available: true,
    fields: resolved,
    missing,
  };
}

// The notice states what the reader is actually looking at. It does not claim a
// translation is scheduled and promises no date.
const DOCUMENT_NOTICE = {
  ru: 'Показана английская версия: перевод на русский недоступен.',
  en: 'Showing the English version: this translation is not available.',
  uk: 'Показано англійську версію: переклад українською недоступний.',
  kk: 'Ағылшын нұсқасы көрсетілген: қазақшаға аударма қолжетімсіз.',
  uz: 'Ingliz tilidagi versiya koʻrsatilmoqda: oʻzbekcha tarjima mavjud emas.',
  es: 'Se muestra la versión en inglés: esta traducción no está disponible.',
  fr: 'Version anglaise affichée : cette traduction n’est pas disponible.',
  hy: 'Ցուցադրվում է անգլերեն տարբերակը՝ հայերեն թարգմանությունը հասանելի չէ։',
};
const DOCUMENT_UNAVAILABLE = {
  ru: 'Этот материал пока недоступен ни на русском, ни на английском.',
  en: 'This material is not available yet.',
  uk: 'Цей матеріал поки недоступний ані українською, ані англійською.',
  kk: 'Бұл материал қазақша да, ағылшынша да әзірге қолжетімсіз.',
  uz: 'Bu material hozircha oʻzbekcha ham, inglizcha ham mavjud emas.',
  es: 'Este material aún no está disponible en español ni en inglés.',
  fr: 'Ce contenu n’est pas encore disponible en français ni en anglais.',
  hy: 'Այս նյութը դեռ հասանելի չէ ո՛չ հայերեն, ո՛չ անգլերեն։',
};

/** Localized notice for a document shown in English instead of the requested locale. */
export function documentFallbackNotice(resolution) {
  if (!resolution || !resolution.available || !resolution.fallback) return '';
  const want = SUPPORTED_LOCALES.includes(resolution.requestedLocale) ? resolution.requestedLocale : 'en';
  return DOCUMENT_NOTICE[want] || DOCUMENT_NOTICE.en;
}

/** Localized bounded message for a document that exists in no served locale. */
export function documentUnavailableNotice(requested) {
  const want = SUPPORTED_LOCALES.includes(requested) ? requested : 'en';
  return DOCUMENT_UNAVAILABLE[want] || DOCUMENT_UNAVAILABLE.en;
}

/**
 * The BTC first-launch UI locale.
 *
 * English is the only first-launch language. A Telegram or browser language is
 * NOT an authority here: it may not select the product locale merely by existing.
 * An explicit user choice always wins, and an authoritative account preference
 * wins when no explicit local choice exists.
 */
export function resolveBtcInitialLocale(input = {}) {
  const supported = (value) => (SUPPORTED_LOCALES.includes(value) ? value : null);
  const saved = supported(input.saved);
  if (saved && (input.savedSource === 'explicit' || !input.savedSource)) {
    return { lang: saved, source: 'explicit' };
  }
  const profile = supported(input.profile);
  if (profile) return { lang: profile, source: 'profile' };
  if (saved && input.savedSource === 'profile') return { lang: saved, source: 'profile' };
  return { lang: 'en', source: 'fallback' };
}

// ── #95 (95D.1 rev 2): the presentation model the readers actually render ────
// rev 1 left each reader to build its own `textOf`, and the Research one returned
// a bare string for every locale — defeating the strict-string rule centrally
// documented above. The reducer now lives here, once, so no reader can weaken it.

const BODY_LEVELS = ['extended', 'simple', 'deep', 'academic'];

/** True when a value looks like a leveled body `{simple|extended|deep|academic}`. */
export function isLeveledBody(value) {
  return !!(value && typeof value === 'object' && !Array.isArray(value)
    && BODY_LEVELS.some((level) => value[level] != null));
}

// One text extraction for every authored prose shape. A bare string carries no
// locale provenance and therefore cannot be shown by the strict BTC path.
function authoredText(value, locale, anchor, preferredLevel) {
  if (value == null) return '';
  if (typeof value === 'string') return '';
  if (Array.isArray(value) || typeof value !== 'object') return '';
  if (isLeveledBody(value)) {
    const order = preferredLevel ? [preferredLevel, ...BODY_LEVELS] : BODY_LEVELS;
    for (const level of order) {
      if (value[level] == null) continue;
      const text = authoredText(value[level], locale, anchor, null);
      if (text && text.trim()) return text;
    }
    return '';
  }
  return typeof value[locale] === 'string' ? value[locale] : '';
}

// Directus intentionally normalizes Crypto ABC labels to a plain Latin string.
// Such labels (Bitcoin, UTXO, Lightning) are stable terminology, not prose, and
// may be reused across locales. A non-Latin bare label has unknown provenance and
// fails closed; localized label maps still require an exact locale entry.
function termLabelText(value, locale) {
  if (typeof value === 'string') {
    const withoutLatin = value.replace(/\p{Script=Latin}/gu, '');
    return value.trim() && !/\p{Letter}/u.test(withoutLatin) ? value : '';
  }
  if (!isPlainObject(value)) return '';
  return typeof value[locale] === 'string' ? value[locale] : '';
}

// A term-based scene (Crypto ABC) is complete in a locale only when EVERY term has
// both a usable label and a description there. One translated term is not a
// translated lesson.
function termsText(terms, locale, anchor) {
  if (!Array.isArray(terms) || !terms.length) return '';
  const parts = [];
  for (const term of terms) {
    const label = termLabelText(term && term.term, locale);
    const description = authoredText(term && term.description, locale, anchor, null);
    if (!label || !label.trim() || !description || !description.trim()) return '';
    parts.push(`${label}\n${description}`);
  }
  return parts.join('\n');
}

/**
 * Build the exact values a BTC reader renders.
 *
 * `fields` accepts `title`, `body`, `insight` and `terms`. The document anchor is
 * the body when present, otherwise the term set, so a scene whose prose lives only
 * in `terms` is still governed by the whole-document rule.
 *
 * Returns `{ available, fallback, requestedLocale, documentLocale, title, body,
 * insight, terms, notice }`, where `notice` is the localized accessible string the
 * reader must display — the fallback notice, or the bounded unavailable message.
 */
export function buildBtcDocumentModel(fields, requested, options = {}) {
  const source = isPlainObject(fields) ? fields : {};
  const anchor = 'en';
  const level = typeof options.level === 'string' ? options.level : null;
  const hasBody = source.body != null && source.body !== '';
  const hasTerms = Array.isArray(source.terms) && source.terms.length > 0;
  const required = hasBody ? ['body'] : (hasTerms ? ['terms'] : ['body']);
  const resolution = resolveDocument(
    { title: source.title, body: source.body, insight: source.insight, terms: source.terms },
    requested,
    {
      fallbackLocales: BTC_DOCUMENT_FALLBACK_LOCALES,
      strictStrings: true,
      required,
      textOf: (value, locale) => (value === source.terms
        ? termsText(source.terms, locale, anchor)
        : authoredText(value, locale, anchor, value === source.body ? level : null)),
    },
  );
  const documentLocale = resolution.documentLocale;
  const terms = (resolution.available && hasTerms)
    ? source.terms.map((term) => ({
      term: termLabelText(term && term.term, documentLocale),
      description: authoredText(term && term.description, documentLocale, anchor, null),
    }))
    : [];
  return {
    available: resolution.available,
    fallback: resolution.fallback,
    requestedLocale: resolution.requestedLocale,
    documentLocale,
    title: resolution.fields.title || '',
    body: resolution.fields.body || '',
    insight: resolution.fields.insight || '',
    terms,
    notice: resolution.available
      ? documentFallbackNotice(resolution)
      : documentUnavailableNotice(resolution.requestedLocale),
  };
}
