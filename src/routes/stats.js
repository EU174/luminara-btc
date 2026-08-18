// JOURNAL-REAL-DATA — real journal metrics (replaces hardcoded STREAK / ACTIVE HOURS).
//   POST /api/v1/me/heartbeat { seconds }  → accumulate today's active seconds (clamped).
//   GET  /api/v1/me/stats                  → { active_seconds, streak }.
//
// ACTIVE HOURS = SUM(user_activity.seconds).
// STREAK       = consecutive days with activity, ending today (or yesterday if today is empty).
//
// The frontend pings /me/heartbeat every ~30s while the tab is visible; each tick adds the
// elapsed active seconds (server-clamped to MAX_TICK to blunt tampering).
import { query } from '../lib/db.js';
import { requireAuth } from '../lib/middleware.js';

const P = '/api/v1';
const MAX_TICK = 120; // a single heartbeat may add at most 120s

// JOURNAL-TZ: resolve a caller-supplied IANA timezone safely. Both the day a
// heartbeat is bucketed into AND the "today/yesterday" used for the streak are
// computed in the user's zone, so a day boundary lands at the user's local
// midnight (not UTC). Falls back to UTC if the tz is missing or invalid.
function safeTz(tz) {
  if (typeof tz !== 'string' || !tz) return 'UTC';
  try {
    // Throws RangeError for an unknown zone; format is a cheap validity probe.
    new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(0);
    return tz;
  } catch (e) {
    return 'UTC';
  }
}

// 'YYYY-MM-DD' → previous day 'YYYY-MM-DD' (UTC math; compared against CURRENT_DATE strings)
function prevDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default async function luminaraStatsRoutes(app) {
  app.post(`${P}/me/heartbeat`, { preHandler: requireAuth }, async (req) => {
    const sub = req.auth.sub;
    let s = Number(req.body && req.body.seconds);
    if (!Number.isFinite(s) || s <= 0) return { ok: true, added: 0 };
    s = Math.min(Math.floor(s), MAX_TICK);
    const tz = safeTz(req.body && req.body.tz); // JOURNAL-TZ: bucket into the user's local day
    await query(
      `INSERT INTO user_activity (user_id, day, seconds)
       VALUES ($1, (now() AT TIME ZONE $3)::date, $2)
       ON CONFLICT (user_id, day)
       DO UPDATE SET seconds = user_activity.seconds + EXCLUDED.seconds`,
      [sub, s, tz]
    );
    return { ok: true, added: s };
  });

  app.get(`${P}/me/stats`, { preHandler: requireAuth }, async (req) => {
    const sub = req.auth.sub;
    const totalRes = await query(
      'SELECT COALESCE(SUM(seconds), 0)::bigint AS total FROM user_activity WHERE user_id = $1',
      [sub]
    );
    const active_seconds = Number(totalRes.rows[0] ? totalRes.rows[0].total : 0);

    const daysRes = await query(
      `SELECT to_char(day, 'YYYY-MM-DD') AS d
         FROM user_activity
        WHERE user_id = $1 AND seconds > 0
        ORDER BY day DESC`,
      [sub]
    );
    const todayRes = await query(
      `SELECT to_char((now() AT TIME ZONE $1)::date, 'YYYY-MM-DD') AS today`,
      [safeTz(req.query && req.query.tz)] // JOURNAL-TZ: "today" in the user's local zone
    );
    const set = new Set(daysRes.rows.map((r) => r.d));
    let cur = todayRes.rows[0].today;
    if (!set.has(cur)) cur = prevDay(cur); // let the streak start yesterday if today has no activity yet
    let streak = 0;
    while (set.has(cur)) { streak++; cur = prevDay(cur); }

    return { active_seconds, streak };
  });
}
