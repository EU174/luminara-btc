# Luminara BTC

Luminara BTC is a privacy-first, noncommercial educational project about Bitcoin and related
Freedom Tech for newcomers, human rights defenders, independent media, educators, and nonprofit
teams.

## Status

**Pre-alpha · public audit candidate · 17 August 2026**

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
and database exports are never committed to this repository.
