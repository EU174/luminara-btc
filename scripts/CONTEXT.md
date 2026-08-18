---
scope: scripts
status: scoped
owner: engineering
last_verified: 2026-07-31
---

# Script context

Read `docs/ai/SECURITY.md` and `docs/ai/TESTING.md`.

QA scripts must fail non-zero on a violated contract and produce concise actionable output. Import, repair, retention, migration, and operator scripts must default to dry-run where practical, require explicit environment selection, validate targets before writes, be idempotent or carry a documented idempotency key, and never print secrets.

Content keys are canonical identifiers, not fuzzy aliases. When two courses share a legacy name, hold the conflicting source record back until it has a distinct key; see [the content-key collision lesson](../docs/ai/lessons/CONTENT-KEY-COLLISION-MUST-NOT-ROUTE.md).

Operator grants and destructive actions require immutable identity lookup, explicit environment, reason/audit data, and confirmation. A static source scan is not a substitute for a behaviour or database test.
