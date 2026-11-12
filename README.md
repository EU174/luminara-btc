# Luminara BTC

Luminara BTC is a privacy-first, noncommercial educational project about Bitcoin and related
Freedom Tech for newcomers, human rights defenders, independent media, educators, and nonprofit
teams.

## Status

**Pre-alpha · public audit snapshot · content manifest v6**

The repository was first opened on 17 August 2026. The current content boundary
is reviewed independently from deployment and publication readiness.

This repository was opened early so that the project can develop transparently. Publication
continues alongside security-boundary, content-rights, secret-history and reproducibility reviews.

The initial repository contains no production configuration, user data, wallet identifiers,
credentials, database exports, or source history from the main Luminara product.

## Product direction

The planned learning surface includes:

- Foundations;
- the Bitcoin ecosystem and future Bitcoin-focused courses;
- artificial intelligence;
- privacy-preserving learning progress and exercises;
- lightweight materials for slow or unreliable internet connections.

## Shared origins and the Bitcoin-only boundary

Luminara BTC grew out of the broader Luminara educational platform. Some shared
source files and historical audit records therefore still contain identifiers for
material outside the BTC product. Their presence is provenance, not an available
course or an endorsement.

The active catalogue is defined by the versioned, server-owned
[`luminara_btc_v1` manifest, version 6](src/lib/btc-content-manifest.js):
**Foundations, the Bitcoin ecosystem, and AI**. Exact course membership, explicit
lesson ownership, and exact scene-key exclusions are applied before content is
returned by the server. Excluded material remains in the shared CMS; it is not
published through the BTC learning API. AI courses are retained unchanged by this
content-selection change. Catalogue filtering preserves the shared originals;
BTC-specific editorial versions are described below.

Exclusions are intentionally public so reviewers can inspect the product boundary.
The identifier-only test fixture records 252 scene identities from the previous
catalogue: version 6 retains 127 and excludes 125. It contains no lesson bodies,
account data, credentials, or operational database dump. Historical content-review
evidence is retained separately from the evidence for the active catalogue;
catalogue membership does not certify translation quality, rights, or launch readiness.

### BTC scene editions (OS-0b)

Manifest v6 declares **30 exact scene replacements**: the original `ck`, source
row ID, SHA-256 `source_hash`, and editorial chunk for each reviewed BTC version.
The metadata-only [review fixture](scripts/fixtures/btc-scene-overrides-v6.json)
contains the same accepted pairs. These replacements preserve the 127-scene
catalogue; they do not add or delete lessons.

On the hosted BTC site, the separate `lum_scenes_btc` collection holds one BTC
version per `ck`; shared originals remain in `lum_scenes`. The server selects the
whole BTC version under the original lesson key and URL, retaining slug and
progress identities. A declared version that is missing, invalid, or unpublished
fails closed without falling back to the original. AI material is unchanged,
and Bitcoin chapter 12 remains outside the replacement table and excluded.

The same manifest records eight internal map substitutions:
`preinternet.{ru,en,uk,kk,uz,es,fr,hy}.html` → the corresponding `*.btc.html`.
The original map URLs are preserved; `economy.ru.html` remains 404.

This public snapshot publishes the v6 declarations for audit. Its lightweight
content handlers read `lum_scenes`; the hosted override resolver, separate CMS
collection, and replacement map payloads belong to the hosted runtime. A
deployment from this snapshot needs that integration to serve the declared BTC
editions. This metadata sync does not import lesson text or certify its rights
or translation coverage.

This repository is a curated, single-product public audit snapshot. Its lightweight
client is separate from the hosted application's full interface. Updating this
snapshot does not deploy the hosted service or establish which artifact is running
there. See [the content boundary](docs/ai/CONTENT-BOUNDARY.md) for local checks.

Public educational reading is intended to remain available without mandatory registration. The
BTC project has no subscriptions, payments, advertising, or paywall.

## Safety principles

- Privacy by default and data minimization.
- Never request seed phrases, private keys, balances, xpubs, or transaction authority.
- Wallet ownership is not personhood, KYC, or proof of funds.
- No collection of a learner's country, threat profile, organization, or personal risk story for
  route selection.
- Regional and legal guidance is published only after appropriate expert review.
- Security-sensitive findings are handled privately before public disclosure.

## Public development

The roadmap, reviewed changes, test evidence, and releases will be published here as the project
passes its safety and licensing gates.

See [ROADMAP.md](ROADMAP.md), [SECURITY.md](SECURITY.md), [PRIVACY.md](PRIVACY.md), and
[CONTRIBUTING.md](CONTRIBUTING.md).

## Licensing

This repository uses two licenses: one for software, one for educational
content.

| Path | License |
|---|---|
| `src/` except `src/content/`, `scripts/`, `migrations/`, `.github/` | AGPL-3.0 — see [LICENSE](LICENSE) |
| `src/content/` | Luminara Educational Content License — see [CONTENT-LICENSE](CONTENT-LICENSE) |

**Software.** The platform, course engine, and interactive modules are
free and open source under the GNU Affero General Public License v3.0.
Any organization may deploy Luminara BTC on its own infrastructure and
fill it with its own content. If you run a modified version as a network
service, AGPL requires you to publish your changes.

**Educational content.** Lesson text, exercises, and scenarios remain the
property of Luminara. They are free to read and free to complete — there
is no registration, subscription, paywall, or advertising — but they may
not be republished or adapted without permission.

This is a safety boundary rather than a commercial one. Regional and
security guidance is published only after expert review; an outdated
copy can carry advice that is no longer safe, and a reader cannot tell
the difference.

**Grant-funded materials.** Content produced with external grant funding
is released under CC BY-SA 4.0 and marked as such in its source files.

Production configuration, user data, wallet identifiers, credentials,
and operational database dumps are never committed to this repository.
