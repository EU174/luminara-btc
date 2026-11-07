---
scope: repository
status: canonical
owner: engineering
last_verified: 2026-08-17
---

# Luminara BTC engineering map

This repository contains only the Bitcoin and Freedom Tech educational product.

Before changing code, read `AGENTS.md`, the nearest `CONTEXT.md`, and the relevant
document below. Do not put secrets, personal data, database URLs or operational exports in Git.

| Scope | Read |
|---|---|
| Runtime and API | `ARCHITECTURE.md`, `SECURITY.md`, `TESTING.md` |
| Content membership, ownership and exclusions | [Content boundary](CONTENT-BOUNDARY.md) |
| Browser learning UI | `ARCHITECTURE.md`, `TESTING.md`, `src/public/v62/CONTEXT.md` |
| Database | `SECURITY.md`, `DEPLOYMENT.md`, `migrations/CONTEXT.md` |
| Release | `DEPLOYMENT.md`, `TESTING.md` |

This engineering map follows the repository's licensing and does not impose
additional reuse restrictions. Software is licensed under AGPL-3.0 (see
[LICENSE](../../LICENSE)). Educational content in `src/content/` is covered
by the Luminara Educational Content License (see
[CONTENT-LICENSE](../../CONTENT-LICENSE)). Materials explicitly marked
`license: CC-BY-SA-4.0` in their source files follow that license. See the
[Licensing section of the main README](../../README.md#licensing).
