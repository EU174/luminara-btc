---
scope: btc-content-boundary
status: canonical
owner: engineering
last_verified: 2026-11-07
---

# Versioned BTC catalogue boundary

`src/lib/btc-content-manifest.js` is the authoritative, immutable membership
contract. Version 5 contains three sections and eleven courses. Child lesson IDs
resolve only through `topicOwners`; individual exclusions use exact canonical
scene keys. Course membership never overrides a scene exclusion. Wildcards,
prefix-based ownership, CMS group names and request flags cannot grant membership.

Apply the same predicates to bootstrap, topic lists, direct scenes, reading
levels and media. Known excluded scene keys are refused before upstream reads.
Keep duplicate canonical identities fail-closed. The dedicated, least-privilege
Directus policy can return a broader collection: read only the required fields
and recheck identity and publication state in the backend. Do not add request-
controlled Directus filter/sort modifiers to that policy view.

The lightweight client derives membership from the serialized manifest. Gaps in
canonical scene order remain gaps in durable URLs; a hidden scene URL must not
silently open the next visible scene. The server remains the authorization boundary.

Public-export handlers must not read modules intentionally excluded from the
export. Quiz metadata uses the small BTC catalogue and gives CMS titles
precedence; it does not load the main product's browser graph. Exercise actual
API handlers in QA, since route-registration checks alone cannot detect a
missing resource on the request path.

Historical evidence describes its original audit, including excluded material.
Active evidence ownership must match the current manifest exactly. New catalogue
members cannot inherit old translation or rights approvals: mark missing evidence
explicitly unverified and keep the publication gate blocked.

Run `npm ci`, `npm test`, and `git diff --check`. The OS-0 suite uses synthetic
prose and an identifier-only fixture to verify 125 excluded and 127 retained
scenes, exact membership, direct API denial, quiz filtering, map refusal and the
shipped lightweight client. It does not certify a hosted deployment, current CMS
inventory, translation quality, or production-interface parity.
