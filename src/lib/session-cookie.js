// Issue #97 / chunk 97C — the single refresh-cookie contract.
//
// Every producer and consumer of the refresh cookie goes through this module, so a
// profile can never end up with two divergent local copies of the name or the
// attributes. The name is owned by the boot profile and by the deployment tier;
// nothing here reads a request header, a query string or browser state.
//
// A wrong-profile cookie name is simply not looked for. It is never accepted as a
// compatibility alias, so a cookie minted by the other profile cannot be replayed
// even if both services are accidentally pointed at the same browser origin.
import { config } from './config.js';

// Deployed BTC uses a `__Host-` prefixed name: the browser then enforces Secure,
// Path=/ and the absence of Domain, so the cookie is locked to the exact host.
const BTC_DEPLOYED_COOKIE = '__Host-lum_btc_rt';
// Local non-HTTPS development cannot use a `__Host-` name (it requires Secure), so a
// distinct development name is used. It is selected ONLY on a local tier and can
// therefore never appear on Railway or any other deployed runtime.
const BTC_DEV_COOKIE = 'lum_btc_rt_dev';

/** The refresh cookie name owned by the boot profile. */
export function refreshCookieName() {
  return config.isDeployed ? BTC_DEPLOYED_COOKIE : BTC_DEV_COOKIE;
}

/**
 * Format a Set-Cookie value for the profile-owned refresh cookie.
 * No `Domain` attribute is ever emitted: a parent-domain cookie would survive a
 * host change, and a Railway-to-custom-domain cutover must NOT carry the session.
 */
export function formatRefreshCookie(value, maxAgeSec) {
  const name = refreshCookieName();
  const parts = [`${name}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAgeSec}`];
  // `__Host-` is invalid without Secure, so a deployed BTC runtime must never emit
  // an insecure refresh cookie; main keeps its historical isProd condition.
  if (name.startsWith('__Host-') || config.secureCookies || config.isProd) parts.push('Secure');
  return parts.join('; ');
}

/** Set the refresh cookie for the full refresh lifetime. */
export function setRefreshCookie(reply, raw) {
  reply.header('Set-Cookie', formatRefreshCookie(raw, config.refreshTtlDays * 86400));
}

/** Clear the refresh cookie. Used by logout, logout-all, denial paths and deletion. */
export function clearRefreshCookie(reply) {
  reply.header('Set-Cookie', formatRefreshCookie('', 0));
}

/** Read the raw refresh token, looking ONLY for the profile-owned name. */
export function readRefreshCookie(req) {
  const name = refreshCookieName();
  const raw = String(req.headers?.cookie || '');
  for (const part of raw.split(';')) {
    const at = part.indexOf('=');
    if (at < 0) continue;
    if (part.slice(0, at).trim() !== name) continue;
    const value = part.slice(at + 1).trim();
    return value || null;
  }
  return null;
}

export const REFRESH_COOKIE_NAMES = Object.freeze({
  btcDeployed: BTC_DEPLOYED_COOKIE,
  btcDevelopment: BTC_DEV_COOKIE,
});
