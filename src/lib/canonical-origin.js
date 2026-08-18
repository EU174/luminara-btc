// Canonical-origin policy for the custom-domain migration (#83).
//
// Redirects are deliberately opt-in and host-allowlisted. Never construct a
// Location from an arbitrary Host header: an attacker must not be able to turn
// Luminara into an open redirect. The old Railway origin keeps API/auth/etc.
// reachable during the grace period; only ordinary GET/HEAD web navigation is
// eligible for a 308.

const HOST_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const NON_REDIRECT_PATHS = [
  '/api/',
  '/auth/',
  '/health',
  '/runtime-config.js',
];

export function normalizeHost(value) {
  const host = String(value || '').trim().toLowerCase().replace(/\.$/, '');
  return HOST_RE.test(host) ? host : '';
}

export function parseHostList(value) {
  return new Set(
    String(value || '')
      .split(',')
      .map(normalizeHost)
      .filter(Boolean),
  );
}

// #92B: every host the request presents — the direct `Host` and each entry of a
// forwarded chain — is a candidate. Preferring one header over the other let a
// request that had already arrived on the canonical host be redirected to the
// URL it was already requesting (an infinite loop behind a proxy that always
// sets X-Forwarded-Host). Deciding which header a given reverse proxy makes
// authoritative would be a guess, so this resolves every candidate and lets
// canonicalRedirect fail closed on anything unknown, malformed or ambiguous.
// Returns null for malformed input; an empty array when no host header is sent.
export function requestHostCandidates(headers = {}) {
  const hosts = [];
  for (const key of ['x-forwarded-host', 'host']) {
    const raw = headers?.[key];
    if (raw === undefined || raw === null) continue;
    const value = (Array.isArray(raw) ? raw.join(',') : String(raw)).trim();
    if (!value) return null; // header present but empty — ambiguous
    for (const part of value.split(',')) {
      // Canonical domains are DNS names. Do not accept IPv6 or an arbitrary URL.
      const host = normalizeHost(part.trim().replace(/:\d+$/, ''));
      if (!host) return null;
      hosts.push(host);
    }
  }
  return hosts;
}

export function isLegacyApiPath(rawUrl) {
  const path = String(rawUrl || '').split('?')[0];
  return NON_REDIRECT_PATHS.some((prefix) => path === prefix || path.startsWith(prefix));
}

export function canonicalRedirect({
  method,
  rawUrl,
  headers,
  canonicalHost,
  redirectEnabled,
  redirectHosts,
}) {
  if (!redirectEnabled || !['GET', 'HEAD'].includes(String(method || '').toUpperCase())) return null;
  const targetHost = normalizeHost(canonicalHost);
  if (!targetHost || !rawUrl || !String(rawUrl).startsWith('/') || String(rawUrl).startsWith('//')) return null;
  if (isLegacyApiPath(rawUrl)) return null;
  const hosts = requestHostCandidates(headers);
  if (!hosts || hosts.length === 0) return null;
  // The request already reached the canonical origin: redirecting it again would
  // send the client to the URL it just requested.
  if (hosts.includes(targetHost)) return null;
  // Every presented host must be an explicit redirect source. An unknown host or
  // a mixed forwarding chain is not evidence of a legacy origin.
  if (!hosts.every((host) => redirectHosts?.has(host))) return null;
  return `https://${targetHost}${rawUrl}`;
}
