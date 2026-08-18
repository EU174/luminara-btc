---
scope: runtime-architecture
status: canonical
owner: engineering
last_verified: 2026-08-17
---

# Luminara BTC architecture

Luminara BTC is a Node.js/Fastify learning service with a dedicated PostgreSQL database.
It serves public course pages, Telegram account authentication, learner progress, quizzes and
privacy-preserving insights.

- `src/server.js` starts the service.
- `src/app.js` registers routes before static assets.
- `src/routes/` owns HTTP contracts.
- `src/lib/` owns configuration, authentication, database and content policy.
- `src/public/` is a light-only browser UI.
- `migrations/btc/` is the only database schema history distributed here.

The browser may improve learning experience but never authorizes protected API actions. Runtime
configuration comes only from environment variables. The app must fail closed if the dedicated
BTC database identity cannot be verified.
