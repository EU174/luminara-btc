import crypto from 'node:crypto';
import { z } from 'zod';
import { config } from '../lib/config.js';
import { verifyTelegramInitData } from '../lib/telegram.js';
import { findOrCreateByIdentity, getRole, loginResult } from '../lib/auth.js';
import { hashToken, issueAccess, issueRefresh } from '../lib/jwt.js';
import { query, tx } from '../lib/db.js';
import { requireFreshAuth } from '../lib/middleware.js';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from '../lib/session-cookie.js';
import { AUTH_LOGIN_RATE_LIMIT, AUTH_REFRESH_RATE_LIMIT } from '../lib/rate-limit.js';

export async function telegramAuthRoutes(app) {
  app.post('/api/v1/auth/telegram', {
    config: { rateLimit: AUTH_LOGIN_RATE_LIMIT },
  }, async (req, reply) => {
    const body = z.object({ initData: z.string() }).safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'bad_request' });
    const tgUser = verifyTelegramInitData(body.data.initData);
    if (!tgUser?.id) return reply.code(401).send({ error: 'invalid_telegram' });

    const tgId = String(tgUser.id);
    const user = await findOrCreateByIdentity({
      provider: 'telegram',
      externalId: tgId,
      displayName: tgUser.username || tgUser.first_name || null,
      locale: config.accountDefaultLocale,
      isSuperadmin: config.superadminTgIds.includes(tgId),
    });
    const result = await loginResult(user, req);
    setRefreshCookie(reply, result.refresh);
    return { token: result.token, user: result.user };
  });
}

export async function sessionRoutes(app) {
  app.post('/api/v1/auth/refresh', {
    config: { rateLimit: AUTH_REFRESH_RATE_LIMIT },
  }, async (req, reply) => {
    const raw = readRefreshCookie(req);
    if (!raw) return reply.code(401).send({ error: 'no_refresh' });
    const hash = hashToken(raw);

    const outcome = await tx(async (client) => {
      const found = await client.query(
        `SELECT s.*,u.is_test,u.auth_version,u.status
         FROM sessions s JOIN users u ON u.id=s.user_id
         WHERE s.refresh_hash=$1 FOR UPDATE OF s`,
        [hash],
      );
      if (!found.rowCount) return { kind: 'invalid' };
      const session = found.rows[0];
      if (session.revoked_at) {
        if (session.revocation_reason !== 'rotation') return { kind: 'invalid' };
        const age = Date.now() - new Date(session.rotated_at || session.revoked_at).getTime();
        if (age <= config.refreshReuseGraceMs) return { kind: 'concurrent' };
        if (session.family_id) {
          await client.query(
            `UPDATE sessions SET revoked_at=COALESCE(revoked_at,now()),
             revocation_reason='reuse_revoke' WHERE family_id=$1`,
            [session.family_id],
          );
        }
        await client.query(
          'UPDATE users SET auth_version=auth_version+1,updated_at=now() WHERE id=$1',
          [session.user_id],
        );
        return { kind: 'reuse' };
      }
      if (session.status !== 'active' || new Date(session.expires_at) <= new Date()) {
        await client.query(
          `UPDATE sessions SET revoked_at=COALESCE(revoked_at,now()),
           revocation_reason=COALESCE(revocation_reason,'expired') WHERE id=$1`,
          [session.id],
        );
        return { kind: 'invalid' };
      }

      const familyId = session.family_id || crypto.randomUUID();
      const next = issueRefresh({ id: session.user_id });
      const expires = new Date(Date.now() + config.refreshTtlDays * 86400000);
      const inserted = await client.query(
        `INSERT INTO sessions(user_id,refresh_hash,family_id,device,ip,expires_at)
         VALUES ($1,$2,$3,$4,NULL,$5) RETURNING id`,
        [session.user_id, next.hash, familyId, session.device, expires],
      );
      await client.query(
        `UPDATE sessions SET family_id=$2,revoked_at=now(),rotated_at=now(),
         replaced_by=$3,revocation_reason='rotation',last_used_at=now() WHERE id=$1`,
        [session.id, familyId, inserted.rows[0].id],
      );
      return {
        kind: 'rotated',
        raw: next.raw,
        sessionId: inserted.rows[0].id,
        userId: session.user_id,
        isTest: session.is_test,
        authVersion: session.auth_version,
      };
    });

    if (outcome.kind === 'concurrent') {
      return reply.code(409).send({ error: 'refresh_already_rotated', retry_login: false });
    }
    if (outcome.kind === 'reuse') {
      clearRefreshCookie(reply);
      return reply.code(401).send({ error: 'refresh_reuse_detected', retry_login: true });
    }
    if (outcome.kind !== 'rotated') return reply.code(401).send({ error: 'invalid_refresh' });
    const role = await getRole(outcome.userId);
    const token = issueAccess(
      { id: outcome.userId, is_test: outcome.isTest, auth_version: outcome.authVersion },
      role,
      outcome.sessionId,
    );
    setRefreshCookie(reply, outcome.raw);
    return { token };
  });

  app.post('/api/v1/auth/logout', async (req, reply) => {
    const raw = readRefreshCookie(req);
    if (raw) {
      await query(
        `UPDATE sessions SET revoked_at=COALESCE(revoked_at,now()),
         revocation_reason=COALESCE(revocation_reason,'logout') WHERE refresh_hash=$1`,
        [hashToken(raw)],
      );
    }
    clearRefreshCookie(reply);
    return { ok: true };
  });

  app.post('/api/v1/auth/logout-all', { preHandler: requireFreshAuth }, async (req, reply) => {
    await tx(async (client) => {
      await client.query(
        `UPDATE sessions SET revoked_at=COALESCE(revoked_at,now()),
         revocation_reason=COALESCE(revocation_reason,'logout_all')
         WHERE user_id=$1`,
        [req.auth.sub],
      );
      await client.query(
        'UPDATE users SET auth_version=auth_version+1,updated_at=now() WHERE id=$1',
        [req.auth.sub],
      );
    });
    clearRefreshCookie(reply);
    return { ok: true };
  });
}
