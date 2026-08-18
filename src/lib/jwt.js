import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from './config.js';

// #97 (97C): the token identity is the profile's immutable LOGICAL identity, never
// the current domain. PUBLIC_HOST is a separate web-security boundary and the
// temporary Railway origin will change; issuer/audience/site must not move with it.
const ALGORITHM = 'HS256';
const issuer = () => config.site.tokenIssuerId;
const audience = () => config.site.tokenAudienceId;
const siteId = () => config.site.siteId;

export function issueAccess(user, role, sessionId) {
  return jwt.sign({
    sub: user.id,
    role,
    test: !!user.is_test,
    sid: sessionId,
    auth_version: Number(user.auth_version || 0),
    site: siteId(),
  }, config.jwtSecret, {
    algorithm: ALGORITHM,
    expiresIn: config.accessTtl,
    issuer: issuer(),
    audience: audience(),
  });
}

export function issueRefresh(user) {
  // opaque random token; only its hash is stored server-side
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hash: hashToken(raw) };
}

/**
 * Server-side lookup hash for an opaque refresh token.
 *
 * Main keeps its legacy plain SHA-256 so existing sessions keep resolving. BTC uses
 * an HMAC keyed by BTC_REFRESH_SECRET with the immutable site id as domain
 * separation, so the SAME raw token produces a different stored hash under each
 * profile. Even if both services were accidentally pointed at one database, a raw
 * refresh token issued by one profile cannot resolve a session row of the other.
 */
export function hashToken(raw) {
  return crypto.createHmac('sha256', config.refreshSecret)
    .update(`${siteId()}:refresh:${raw}`)
    .digest('hex');
}

export function verifyAccess(token) {
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: [ALGORITHM],
      issuer: issuer(),
      audience: audience(),
    });
    // `site` is checked explicitly: a token whose issuer/audience were somehow
    // accepted still fails unless it names this exact profile.
    if (!payload || payload.site !== siteId()) return null;
    return payload;
  } catch { return null; }
}
