---
scope: migrations
status: scoped
owner: database
last_verified: 2026-07-31
---

# Migration context

Read `docs/ai/SECURITY.md`, `docs/ai/DEPLOYMENT.md`, and DB test instructions.

Migrations are ordered, append-only schema history. Never edit, rename, reorder, or reuse the number of a migration that may have been applied. Determine the next number from the actual authoritative branch and database history, not from a stale ZIP.

Prefer additive, idempotent, backward-compatible changes. Define constraints and indexes explicitly. For data backfills, specify batching, audit impact, rollback or forward-fix strategy, and expected row counts. Run preflight/dry-run and post-migration verification against the intended environment before deployment.
