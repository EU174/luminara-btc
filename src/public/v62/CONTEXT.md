---
scope: src/public/v62
status: scoped
owner: frontend
last_verified: 2026-07-31
---

# v62 frontend context

Read `docs/ai/CONTENT-I18N.md`, `docs/ai/TESTING.md`, and `docs/ai/SECURITY.md` for authentication or premium UI.

This is the current browser application shell. Preserve script load order, route/hash durability, locale resolution, mobile safe areas, readable contrast, and bounded error states. Never use translated titles as React keys or durable IDs. A language change must re-resolve the current entity by stable ID rather than mutate cached content in place.

Frontend gating is presentation only; paid and private resources remain server-gated. Verify desktop and mobile layouts for navigation, modals, account/admin pages, and embedded interactives.
