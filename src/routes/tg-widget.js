import crypto from 'node:crypto';
import { z } from 'zod';
import { config } from '../lib/config.js';
import { findOrCreateByIdentity, loginResult } from '../lib/auth.js';
import { AUTH_LOGIN_RATE_LIMIT } from '../lib/rate-limit.js';
import { setRefreshCookie } from '../lib/session-cookie.js';

function verifyWidget(data) {
  if (!data || !config.telegramBotToken || !data.hash) return null;
  const { hash, ...fields } = data;
  const check = Object.keys(fields)
    .filter((key) => fields[key] !== undefined && fields[key] !== null)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('\n');
  const secret = crypto.createHash('sha256').update(config.telegramBotToken).digest();
  const computed = crypto.createHmac('sha256', secret).update(check).digest('hex');
  const expected = Buffer.from(computed);
  const received = Buffer.from(String(hash));
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;
  const authDate = Number.parseInt(fields.auth_date || '0', 10);
  const now = Date.now() / 1000;
  if (!authDate || now - authDate > 86400 || authDate - now > 60) return null;
  return fields;
}

export default async function tgWidgetRoutes(app) {
  app.post('/api/v1/auth/telegram-widget', {
    config: { rateLimit: AUTH_LOGIN_RATE_LIMIT },
  }, async (req, reply) => {
    const parsed = z.object({
      id: z.union([z.number(), z.string()]),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      username: z.string().optional(),
      photo_url: z.string().optional(),
      auth_date: z.union([z.number(), z.string()]),
      hash: z.string(),
    }).passthrough().safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'bad_request' });
    const tg = verifyWidget(parsed.data);
    if (!tg?.id) return reply.code(401).send({ error: 'invalid_telegram' });

    const tgId = String(tg.id);
    const user = await findOrCreateByIdentity({
      provider: 'telegram',
      externalId: tgId,
      displayName: tg.username || tg.first_name || null,
      locale: config.accountDefaultLocale,
      isSuperadmin: config.superadminTgIds.includes(tgId),
    });
    const result = await loginResult(user, req);
    setRefreshCookie(reply, result.refresh);
    return { token: result.token, user: result.user };
  });
}
