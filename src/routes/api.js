import { z } from 'zod';
import { query } from '../lib/db.js';
import { requireAuth, requireFreshAuth } from '../lib/middleware.js';
import { getRole } from '../lib/auth.js';

export async function accountRoutes(app) {
  app.get('/api/v1/me', { preHandler: requireAuth }, async (req, reply) => {
    const { rows } = await query('SELECT * FROM users WHERE id=$1', [req.auth.sub]);
    if (!rows.length) return reply.code(404).send({ error: 'not_found' });
    const user = rows[0];
    return {
      user: {
        id: user.id,
        display_name: user.display_name,
        locale: user.locale,
        birthday: user.birthday,
        role: await getRole(user.id),
        is_test: false,
      },
    };
  });

  app.patch('/api/v1/me', { preHandler: requireFreshAuth }, async (req) => {
    const body = z.object({
      display_name: z.string().max(80).optional(),
      locale: z.enum(['en', 'ru', 'uk', 'kk', 'uz', 'es', 'fr', 'hy']).optional(),
      birthday: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'birthday must be YYYY-MM-DD')
        .refine((value) => {
          const [year, month, day] = value.split('-').map(Number);
          const date = new Date(Date.UTC(year, month - 1, day));
          return date.getUTCFullYear() === year
            && date.getUTCMonth() === month - 1
            && date.getUTCDate() === day
            && year >= 1900
            && date.getTime() <= Date.now();
        }, 'birthday must be a real past date')
        .nullable()
        .optional(),
    }).parse(req.body || {});
    const owns = (key) => Object.prototype.hasOwnProperty.call(body, key);
    const { rows } = await query(
      `UPDATE users SET
         display_name=CASE WHEN $2::boolean THEN $3 ELSE display_name END,
         locale=CASE WHEN $4::boolean THEN $5 ELSE locale END,
         birthday=CASE WHEN $6::boolean THEN $7::date ELSE birthday END,
         updated_at=now()
       WHERE id=$1 RETURNING *`,
      [
        req.auth.sub,
        owns('display_name'), body.display_name ?? null,
        owns('locale'), body.locale ?? null,
        owns('birthday'), body.birthday ?? null,
      ],
    );
    const user = rows[0];
    return {
      user: {
        id: user.id,
        display_name: user.display_name,
        locale: user.locale,
        birthday: user.birthday,
      },
    };
  });
}

export async function insightsRoutes(app, opts = {}) {
  const writeGuards = opts.writeGuards || [requireFreshAuth];
  app.post('/api/v1/insights', { preHandler: writeGuards }, async (req) => {
    const body = z.object({
      topic: z.string().max(40).optional(),
      body: z.string().min(1).max(2000),
    }).parse(req.body);
    const { rows } = await query(
      'INSERT INTO insights(user_id,topic,body) VALUES ($1,$2,$3) RETURNING *',
      [req.auth.sub, body.topic || null, body.body],
    );
    return { insight: rows[0] };
  });

  app.patch('/api/v1/insights/:id', { preHandler: writeGuards }, async (req, reply) => {
    const body = z.object({
      shared: z.boolean().optional(),
      share_links: z.record(z.string()).optional(),
    }).parse(req.body || {});
    const { rows } = await query(
      `UPDATE insights SET
         shared=COALESCE($3,shared),
         status=CASE WHEN $3=TRUE THEN 'pending' ELSE status END,
         share_links=COALESCE($4,share_links)
       WHERE id=$1 AND user_id=$2 RETURNING *`,
      [req.params.id, req.auth.sub, body.shared ?? null,
        body.share_links ? JSON.stringify(body.share_links) : null],
    );
    if (!rows.length) return reply.code(404).send({ error: 'not_found' });
    return { insight: rows[0] };
  });

  app.get('/api/v1/insights/mine', { preHandler: requireAuth }, async (req) => {
    const { rows } = await query(
      `SELECT id,topic,body,shared,status,created_at FROM insights
       WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,
      [req.auth.sub],
    );
    return { insights: rows };
  });

  app.get('/api/v1/insights/feed', async (req) => {
    const topic = String(req.query.topic || '').slice(0, 40);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const params = ['published'];
    let where = 'status=$1';
    if (topic) {
      params.push(topic);
      where += ' AND topic=$2';
    }
    const { rows } = await query(
      `SELECT topic,body,created_at FROM insights WHERE ${where}
       ORDER BY created_at DESC LIMIT ${limit}`,
      params,
    );
    return { insights: rows };
  });
}
