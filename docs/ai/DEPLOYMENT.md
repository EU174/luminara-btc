---
scope: deployment
status: canonical
owner: release
last_verified: 2026-08-17
---

# BTC deployment contract

Deploy only code reviewed against this repository to the dedicated BTC service and database.
Before release: verify a clean tree, run the full BTC suite, validate runtime configuration without
printing values, confirm database identity and test `/health`, public course content and Telegram
sign-in. Commit, push, migration and deployment are separate approved actions.
