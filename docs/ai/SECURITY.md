---
scope: security
status: canonical
owner: security
last_verified: 2026-08-17
---

# Luminara BTC security contract

- Verify Telegram identity server-side; never authorize by a client flag or mutable display name.
- Superadmin status derives only from verified immutable identifiers in environment configuration.
- Keep secrets in an approved secret store or environment variables, never in Git, logs, handoffs,
  screenshots or browser code.
- The BTC runtime credential may access only the dedicated BTC database and must verify its database
  identity before serving traffic.
- Directus access is read-only, field-limited and row-limited. Browser clients never receive a
  Directus credential.
- Do not collect seed phrases, private keys, balances, addresses, country, threat profile,
  organization or personal risk narrative for learning routes.
- Public learning content is public; authenticated writes require a valid server session and
  parameterized bounded inputs.
