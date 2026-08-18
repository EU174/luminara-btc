---
scope: src/routes
status: scoped
owner: backend
last_verified: 2026-07-31
---

# HTTP route context

Read `docs/ai/SECURITY.md`, `docs/ai/ARCHITECTURE.md`, and the affected route tests.

Validate authentication, role, environment, entitlement, parameters, and ownership at the server boundary. Use shared library functions for policy decisions. Keep response shapes stable, avoid leaking identifiers or internal errors, and register special routes before static serving.

Any new admin endpoint requires explicit RBAC, audit behaviour, bounded pagination, and a focused test. Any redirect or share endpoint requires allowlisted destinations and parameter-preservation tests.
