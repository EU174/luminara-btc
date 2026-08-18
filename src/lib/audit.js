// Best-effort audit trail for sensitive actions (e.g. moderation). Writes to the
// audit_log table from migration 001. NEVER throws — recording an action must never
// break the request that performed it.
import { query } from './db.js';

export async function audit(actorId, action, target, meta) {
  try {
    await query(
      `INSERT INTO audit_log (actor_id, actor_id_snapshot, action, target, meta)
       VALUES ($1, $1, $2, $3, $4)`,
      [actorId || null, action, target == null ? null : String(target), meta ? JSON.stringify(meta) : null]
    );
  } catch (e) {
    // swallow — a failed audit write should never surface to the user
  }
}
