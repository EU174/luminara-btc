---
scope: verification
status: canonical
owner: qa
last_verified: 2026-08-17
---

# Verification contract

Before a release, run `npm ci`, `npm test` and `git diff --check` in a clean tree.

The aggregate suite verifies exact BTC route inventory, allowed course manifest, content evidence,
the physical BTC-only browser boundary, BTC schema and database isolation. A production release
also requires health, public course, Telegram login and database-boundary verification without
printing secrets.

Do not mark a release verified merely because a build or archive exists.
