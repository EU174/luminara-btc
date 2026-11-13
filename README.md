# Luminara BTC

Luminara BTC is a privacy-first, noncommercial educational project about Bitcoin and related
Freedom Tech for newcomers, human rights defenders, independent media, educators, and nonprofit
teams.

## Status

**Pre-alpha · public audit snapshot for hosted BTC v2.15 · content manifest v9**

The hosted BTC release is **v2.15**, verified on 13 November 2026 at
[luminarabtc.academy](https://luminarabtc.academy/atlas). This public source snapshot
is prepared separately; it does not contain the full hosted runtime. Current
snapshot metadata is recorded in [PUBLIC-SNAPSHOT.json](PUBLIC-SNAPSHOT.json).

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
[`luminara_btc_v1` manifest, version 9](src/lib/btc-content-manifest.js):
**Foundations, the Bitcoin ecosystem, and AI**. Exact course membership, explicit
lesson ownership, and exact scene-key exclusions are applied before content is
returned by the server. Excluded material remains in the shared CMS; it is not
published through the BTC learning API. AI courses are retained unchanged by this
content-selection change. Catalogue filtering preserves the shared originals;
BTC-specific editorial versions are described below.

Exclusions are intentionally public so reviewers can inspect the product boundary.
The identifier-only test fixture records 252 scene identities from the previous
catalogue: version 9 retains 127 and excludes 125. It contains no lesson bodies,
account data, credentials, or operational database dump. Historical content-review
evidence is retained separately from the evidence for the active catalogue;
catalogue membership does not certify translation quality, rights, or launch readiness.

### BTC scene editions (OS-0b)

Manifest v9 declares **40 exact scene replacements**: the original `ck`, source
row ID, SHA-256 `source_hash`, and editorial chunk for each reviewed BTC version.
The metadata-only [review fixture](scripts/fixtures/btc-scene-overrides-v9.json)
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

This public snapshot publishes the v9 declarations for audit. Its lightweight
content handlers read `lum_scenes`; the hosted override resolver, separate CMS
collection, and replacement map payloads belong to the hosted runtime. A
deployment from this snapshot needs that integration to serve the declared BTC
editions. The local content export in `content/scenes/` contains 74 current grant-scope
scene snapshots, including available reading levels; it contains no account data
or CMS credentials. See `content/index.json`. It does not claim completion of
all per-course translation/third-party-rights reviews or wire this lightweight
client to the hosted resolver.

This repository is a curated, single-product public audit snapshot. Its lightweight
client is separate from the hosted application's full interface. Updating this
snapshot does not deploy the hosted service or establish which artifact is running
there. See [the content boundary](docs/ai/CONTENT-BOUNDARY.md) for local checks.

The hosted BTC service has a 71-scene anonymous preview. A learner session or a
personal reviewer link opens the 127-scene catalogue; these access modes are not
payment requirements. All available BTC reading levels, including Deep and
Academic, are free. The BTC profile has no subscription or payment routes.

## OpenSats application scope

The proposed grant covers Bitcoin and related digital-security education:
63 Foundations scenes and 11 Bitcoin Atlas chapters. The 53 AI scenes remain
accessible on the platform but are explicitly outside this application and its
budget. This is an application-scope statement, not a claim of awarded funding.

The current public tree excludes the five maps that the hosted BTC profile
already denies: web3.ru.html, netocracy.ru.html, economy.ru.html,
luminara-demo-web3.html and luminara-demo-netocracy.html. The hosted originals
for the main Luminara product are preserved. Git history is not rewritten by
this local change.

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

Software keeps **AGPL-3.0**, see [LICENSE](LICENSE). Original educational
contributions owned by Luminara BTC use **CC BY-SA 4.0 now**, without a funding
condition: see [CONTENT-LICENSE](CONTENT-LICENSE) and
[content/LICENSE](content/LICENSE).

This covers Luminara-owned prose, exercises, scenarios and translations, not
the software or third-party quotations, images, videos, trademarks and linked
publications. Their own rights remain; citations and existing notices must be
preserved. See [third-party notice](content/THIRD-PARTY-NOTICE.txt). Being listed
in the catalogue does not certify ownership of every embedded work or completion
of per-course translation/rights review.

You may share and adapt covered original contributions, including commercially,
with attribution, a licence link and an indication of changes; adaptations keep
the same or a compatible licence. Full terms:
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/legalcode.en).

Production configuration, user data, wallet identifiers, credentials,
and operational database dumps are never committed to this repository.

## Hosted release v2.15 and this public snapshot

The hosted BTC release v2.15 preserves manifest v9 and its 40 exact scene
variants, including web2:6.
Four Web30 interactive editions have complete Russian and English payloads;
the display title of web30:0 is localized in eight languages after raw version
validation. The original CMS identity and source records are preserved.
This audit snapshot declares that boundary; its lightweight handlers are not
a full reproduction of the hosted resolver or protected media runtime.

The v2.15 hosted release also publishes the approved
[RU privacy notice](https://luminarabtc.academy/btc-info.html?page=privacy&lang=ru) /
[EN privacy notice](https://luminarabtc.academy/btc-info.html?page=privacy&lang=en),
the [content licence](https://luminarabtc.academy/btc-info.html?page=license&lang=en),
and [grant scope](https://luminarabtc.academy/btc-info.html?page=grant&lang=en). It
removes BTC subscription badges, improves source and administration presentation,
and exposes repeat copy for eligible reviewer links. Those full hosted UI and
reviewer implementations are not supplied by this lightweight audit snapshot.

The educational export in `content/scenes/` reflects the accepted v9 CMS snapshot
of 13 November 2026, used unchanged by v2.15. It contains 63 Foundations scenes and
11 Bitcoin Atlas chapters. No missing translation or reading level is invented,
and inclusion does not certify third-party rights or completion of native-language review.
The [initial export record](EXPORT-PROVENANCE.json) remains historical evidence
from August; it is not the status of this November snapshot.

Privacy targets are approved, but automatic retention cleanup is not enabled.
The notice distinguishes current behaviour from target periods, including the
existing manual backups without expiry. See [PRIVACY.md](PRIVACY.md); publishing
this source snapshot does not change data retention or backup configuration.
