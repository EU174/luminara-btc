import { z } from 'zod';
import { query, tx } from '../lib/db.js';
import { requireAuth, requireFreshAuth } from '../lib/middleware.js';
import { clearRefreshCookie } from '../lib/session-cookie.js';

const P = '/api/v1';

export async function progressRoutes(app) {
  app.get(`${P}/progress`, { preHandler: requireAuth }, async (req) => {
    const { rows } = await query(
      `SELECT lp.topic,lp.scene_idx,lp.completed,lp.completion_mode,
              lp.last_scene_idx,lp.last_visited_at,
              COALESCE(
                jsonb_agg(jsonb_build_object(
                  'scene_key',sp.scene_key,
                  'scene_idx',sp.scene_idx,
                  'completed_at',sp.completed_at
                ) ORDER BY sp.scene_idx,sp.scene_key)
                FILTER (WHERE sp.scene_key IS NOT NULL),
                '[]'::jsonb
              ) AS completed_scenes
       FROM lesson_progress lp
       LEFT JOIN lesson_scene_progress sp
         ON sp.user_id=lp.user_id AND sp.topic=lp.topic
       WHERE lp.user_id=$1
       GROUP BY lp.topic,lp.scene_idx,lp.completed,lp.completion_mode,
                lp.last_scene_idx,lp.last_visited_at`,
      [req.auth.sub],
    );
    const quiz = await query(
      `SELECT topic_key,COUNT(*)::int AS attempted,
              COUNT(*) FILTER (WHERE correct)::int AS correct
       FROM quiz_attempts WHERE user_id=$1 GROUP BY topic_key`,
      [req.auth.sub],
    );
    const byTopic = {};
    for (const row of rows) {
      byTopic[row.topic] = {
        scene_idx: row.scene_idx,
        completed: row.completed,
        completion_mode: row.completion_mode,
        completed_scenes: row.completed_scenes,
        last_scene_idx: row.last_scene_idx ?? row.scene_idx,
        last_visited_at: row.last_visited_at ?? null,
      };
    }
    const quizByTopic = {};
    let attempted = 0;
    let correct = 0;
    for (const row of quiz.rows) {
      const topicAttempted = Number(row.attempted) || 0;
      const topicCorrect = Number(row.correct) || 0;
      attempted += topicAttempted;
      correct += topicCorrect;
      quizByTopic[row.topic_key] = {
        attempted: topicAttempted,
        correct: topicCorrect,
        score_pct: topicAttempted ? Math.round((topicCorrect / topicAttempted) * 100) : null,
      };
    }
    return {
      byTopic,
      quizByTopic,
      quizSummary: {
        attempted,
        correct,
        score_pct: attempted ? Math.round((correct / attempted) * 100) : null,
      },
    };
  });

  app.post(`${P}/progress`, { preHandler: requireFreshAuth }, async (req) => {
    const body = z.object({
      topic: z.string().min(1).max(40),
      scene_idx: z.number().int().min(0).max(10000).optional(),
      completed: z.boolean().optional(),
      scene_key: z.string().trim().min(1).max(200).optional(),
      total_scenes: z.number().int().min(1).max(10000).optional(),
    }).refine((value) => !value.scene_key || Number.isInteger(value.total_scenes), {
      message: 'total_scenes is required with scene_key',
      path: ['total_scenes'],
    }).parse(req.body || {});

    if (!body.scene_key) {
      await query(
        `INSERT INTO lesson_progress
           (user_id,topic,scene_idx,completed,last_scene_idx,updated_at)
         VALUES ($1,$2,$3,$4,$3,now())
         ON CONFLICT (user_id,topic) DO UPDATE SET
           scene_idx=GREATEST(lesson_progress.scene_idx,EXCLUDED.scene_idx),
           completed=lesson_progress.completed OR EXCLUDED.completed,
           updated_at=now()`,
        [req.auth.sub, body.topic, body.scene_idx ?? 0, body.completed === true],
      );
      return { ok: true };
    }

    await tx(async (client) => {
      await client.query(
        `INSERT INTO lesson_progress
           (user_id,topic,scene_idx,completed,completion_mode,last_scene_idx,updated_at)
         VALUES ($1,$2,$3,FALSE,'exact',$3,now())
         ON CONFLICT (user_id,topic) DO UPDATE SET
           scene_idx=GREATEST(lesson_progress.scene_idx,EXCLUDED.scene_idx),
           completion_mode='exact',updated_at=now()`,
        [req.auth.sub, body.topic, body.scene_idx ?? 0],
      );
      await client.query(
        `INSERT INTO lesson_scene_progress
           (user_id,topic,scene_key,scene_idx,completed_at)
         VALUES ($1,$2,$3,$4,now())
         ON CONFLICT (user_id,topic,scene_key) DO UPDATE
         SET scene_idx=EXCLUDED.scene_idx`,
        [req.auth.sub, body.topic, body.scene_key, body.scene_idx ?? 0],
      );
      const count = await client.query(
        `SELECT COUNT(*)::int AS completed_count FROM lesson_scene_progress
         WHERE user_id=$1 AND topic=$2`,
        [req.auth.sub, body.topic],
      );
      await client.query(
        `UPDATE lesson_progress SET completed=$3,updated_at=now()
         WHERE user_id=$1 AND topic=$2`,
        [req.auth.sub, body.topic, Number(count.rows[0]?.completed_count || 0) >= body.total_scenes],
      );
    });
    return { ok: true };
  });

  app.post(`${P}/progress/visit`, { preHandler: requireFreshAuth }, async (req) => {
    const body = z.object({
      topic: z.string().trim().min(1).max(40),
      scene_idx: z.number().int().min(0).max(10000),
    }).parse(req.body || {});
    await query(
      `INSERT INTO lesson_progress
         (user_id,topic,scene_idx,completed,completion_mode,last_scene_idx,last_visited_at,updated_at)
       VALUES ($1,$2,0,FALSE,'exact',$3,now(),now())
       ON CONFLICT (user_id,topic) DO UPDATE SET
         last_scene_idx=EXCLUDED.last_scene_idx,
         last_visited_at=EXCLUDED.last_visited_at,
         updated_at=now()`,
      [req.auth.sub, body.topic, body.scene_idx],
    );
    return { ok: true };
  });
}

export async function consentRoutes(app) {
  app.get(`${P}/consent`, { preHandler: requireAuth }, async (req) => {
    const { rows } = await query(
      `SELECT expires_at FROM consents
       WHERE user_id=$1 AND kind='data_storage' AND revoked_at IS NULL
       ORDER BY granted_at DESC LIMIT 1`,
      [req.auth.sub],
    );
    return { data_storage: { expires_at: rows[0]?.expires_at || null } };
  });
  app.post(`${P}/consent/extend`, { preHandler: requireAuth }, async (req) => {
    const { rows } = await query(
      `INSERT INTO consents
         (user_id,kind,policy_version,source,granted_at,expires_at)
       VALUES ($1,'data_storage',$2,'settings',now(),now()+interval '1 year')
       RETURNING expires_at`,
      [req.auth.sub, process.env.POLICY_VERSION || '1.0'],
    );
    return { expires_at: rows[0].expires_at };
  });
}

export async function accountDeletionRoutes(app) {
  app.delete(`${P}/me`, { preHandler: requireFreshAuth }, async (req, reply) => {
    await tx(async (client) => {
      await client.query(
        `INSERT INTO audit_log(actor_id,actor_id_snapshot,action,target,meta)
         VALUES ($1::uuid,$1::uuid,'account_delete',$1::text,$2::jsonb)`,
        [req.auth.sub, JSON.stringify({ at: new Date().toISOString() })],
      );
      await client.query('DELETE FROM users WHERE id=$1', [req.auth.sub]);
    });
    clearRefreshCookie(reply);
    return { ok: true };
  });
}
