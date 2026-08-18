import crypto from 'node:crypto';
import { query, tx } from './db.js';
import { config } from './config.js';
import { issueAccess, issueRefresh } from './jwt.js';

const ROLE_RANK = { superadmin: 4, admin: 3, moderator: 2, user: 1 };
const IDENTITY_PROVIDERS = new Set(['telegram', 'bitcoin']);

export async function getRole(userId) {
  const { rows } = await query(
    'SELECT r.name FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=$1',
    [userId],
  );
  let best = 'user';
  for (const { name } of rows) {
    if ((ROLE_RANK[name] || 0) > (ROLE_RANK[best] || 0)) best = name;
  }
  return best;
}

async function assignRole(client, userId, roleName) {
  await client.query(
    `INSERT INTO user_roles(user_id,role_id)
     SELECT $1,id FROM roles WHERE name=$2 ON CONFLICT DO NOTHING`,
    [userId, roleName],
  );
}

export async function findOrCreateByIdentity({
  provider, externalId, displayName, locale, isSuperadmin,
}) {
  if (!IDENTITY_PROVIDERS.has(provider)) throw new Error('unsupported_identity_provider');
  return tx(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${provider}:${externalId}`]);
    const found = await client.query(
      `SELECT u.*,i.id AS identity_id
       FROM users u JOIN identities i ON i.user_id=u.id
       WHERE i.provider=$1 AND i.external_id=$2 FOR UPDATE OF i`,
      [provider, externalId],
    );
    let user = found.rows[0];
    if (user) {
      await client.query('UPDATE identities SET verified=TRUE WHERE id=$1', [user.identity_id]);
    } else {
      const inserted = await client.query(
        'INSERT INTO users(display_name,locale) VALUES ($1,$2) RETURNING *',
        [displayName || null, locale || config.accountDefaultLocale],
      );
      user = inserted.rows[0];
      await client.query(
        `INSERT INTO identities(user_id,provider,external_id,verified)
         VALUES ($1,$2,$3,TRUE)`,
        [user.id, provider, externalId],
      );
      await assignRole(client, user.id, 'user');
    }
    if (isSuperadmin) await assignRole(client, user.id, 'superadmin');
    return user;
  });
}

function stableDeviceId(req) {
  const supplied = String(req.headers['x-device-id'] || '').trim();
  if (/^[A-Za-z0-9._:-]{8,128}$/.test(supplied)) return `client:${supplied}`;
  const ua = String(req.headers['user-agent'] || 'unknown').slice(0, 500);
  return `ua:${crypto.createHash('sha256').update(ua).digest('hex').slice(0, 32)}`;
}

export async function createSession(user, req) {
  const prepared = issueRefresh(user);
  return tx(async (client) => {
    const expires = new Date(Date.now() + config.refreshTtlDays * 86400000);
    const device = stableDeviceId(req);
    await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [user.id]);
    await client.query(
      `UPDATE sessions SET revoked_at=now(),revocation_reason='device_replaced'
       WHERE user_id=$1 AND device=$2 AND revoked_at IS NULL`,
      [user.id, device],
    );
    const active = await client.query(
      `SELECT id FROM sessions
       WHERE user_id=$1 AND revoked_at IS NULL AND expires_at>now()
       ORDER BY created_at FOR UPDATE`,
      [user.id],
    );
    if (active.rowCount >= config.maxActiveSessions) {
      await client.query(
        `UPDATE sessions SET revoked_at=now(),revocation_reason='device_limit'
         WHERE id=ANY($1::uuid[]) AND revoked_at IS NULL`,
        [active.rows.map((row) => row.id)],
      );
    }
    const familyId = crypto.randomUUID();
    const inserted = await client.query(
      `INSERT INTO sessions(user_id,refresh_hash,family_id,device,ip,expires_at)
       VALUES ($1,$2,$3,$4,NULL,$5) RETURNING id`,
      [user.id, prepared.hash, familyId, device, expires],
    );
    return { raw: prepared.raw, sessionId: inserted.rows[0].id };
  });
}

export async function loginResult(user, req) {
  const role = await getRole(user.id);
  const session = await createSession(user, req);
  return {
    token: issueAccess(user, role, session.sessionId),
    refresh: session.raw,
    user: {
      id: user.id,
      display_name: user.display_name,
      locale: user.locale,
      role,
      is_test: false,
    },
  };
}
