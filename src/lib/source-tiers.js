// Checkpoint E / E3 — basic vs extended academic source tiers.
//
// Every source carries an access tier: 'basic' (default, backwards compatible) or 'extended'.
// Free users receive ONLY basic sources; paid users receive basic + extended. This MUST be
// enforced server-side BEFORE serialization — extended source data must never be shipped in a
// public bundle and merely hidden in React. These pure helpers do the filtering; the content
// route applies them at each response point (and the public bootstrap always uses basic-only).

export const SOURCE_TIERS = ['basic', 'extended'];

// Normalize a single source's tier. Anything not explicitly 'extended' defaults to 'basic', so
// existing sources with no tier keep working exactly as before.
export function sourceTier(src) {
  return (src && src.tier === 'extended') ? 'extended' : 'basic';
}

// Filter a source array for a viewer. `paid` = server-confirmed paid access. Free viewers get
// basic only; paid get everything. Returns a NEW array (never mutates input) and drops the raw
// `tier` field only if you ask to — by default we keep it so the UI can group Core/Additional.
export function filterSourcesByTier(sources, { paid } = {}) {
  if (!Array.isArray(sources)) return [];
  return sources.filter((s) => paid || sourceTier(s) === 'basic');
}

// Split into { core, extended } groups for the UI (only non-empty groups should be rendered by
// the caller). `paid` gates whether extended is populated at all.
export function groupSourcesByTier(sources, { paid } = {}) {
  const visible = filterSourcesByTier(sources, { paid });
  return {
    core: visible.filter((s) => sourceTier(s) === 'basic'),
    extended: visible.filter((s) => sourceTier(s) === 'extended'),
  };
}
