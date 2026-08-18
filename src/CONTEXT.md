---
scope: src
status: scoped
owner: backend
last_verified: 2026-08-15
---

# Application source context

Read `docs/ai/ARCHITECTURE.md`, `docs/ai/SECURITY.md`, and `docs/ai/TESTING.md` before changing application source.

`app.js` is the composition root; `server.js` is only the listening entry point. Preserve route registration before the static handler and preserve environment isolation. Shared domain decisions belong in `lib/`; HTTP parsing and response contracts belong in `routes/`; browser-only presentation belongs in `public/`.

Do not move authorization decisions into the browser or duplicate configuration constants across frontend and backend.

For the least-privilege BTC Directus token, treat the policy-filtered collection
view as the remote boundary and apply stable-id filtering and ordering in the
backend. Do not add client-supplied Directus `filter` or `sort` modifiers without
the live capability check described in the
[restricted Directus query lesson](../docs/ai/lessons/DIRECTUS-RESTRICTED-POLICY-QUERY-MODIFIERS.md).
