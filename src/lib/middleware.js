import { verifyAccess } from './jwt.js';
import { query } from './db.js';

export function bearerPayload(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  return token ? verifyAccess(token) : null;
}

// Fastify preHandler: attaches req.auth = { sub, role, test } or 401s.
// Every authenticated request is session-backed. In particular, an access JWT whose
// `sid` was revoked by logout must stop authorising reads immediately instead of staying
// usable until its 15-minute signature expiry (AUTH-ACCOUNT-SWITCH #34).
export async function requireAuth(req, reply) {
  const payload = await freshAuth(req);
  if (!payload) {
    reply.code(401).send({ error: 'unauthorized', message: 'Valid token required' });
    return;
  }
  req.auth = payload;
}

// DB-backed validation shared by ordinary authenticated reads and sensitive operations.
export async function freshAuth(req) {
  const payload = bearerPayload(req);
  if (!payload || !payload.sid || payload.auth_version == null) return null;
  const { rows } = await query(
    `SELECT u.status, u.auth_version
     FROM users u JOIN sessions s ON s.user_id=u.id
     WHERE u.id=$1 AND s.id=$2 AND s.revoked_at IS NULL AND s.expires_at>now()`,
    [payload.sub, payload.sid]
  );
  const state = rows[0];
  if (!state || state.status !== 'active' || Number(state.auth_version) !== Number(payload.auth_version)) {
    return null;
  }
  return payload;
}

export async function requireFreshAuth(req, reply) {
  const payload = await freshAuth(req);
  if (!payload) {
    return reply.code(401).send({ error: 'stale_auth', message: 'Fresh authentication required' });
  }
  req.auth = payload;
}

const RANK = { superadmin: 4, admin: 3, moderator: 2, user: 1 };
export function requireRole(min) {
  return function (req, reply, done) {
    if (!req.auth) { reply.code(401).send({ error: 'unauthorized' }); return; }
    if ((RANK[req.auth.role] || 0) < (RANK[min] || 99)) {
      reply.code(403).send({ error: 'forbidden', message: `Requires ${min}` });
      return;
    }
    done();
  };
}
