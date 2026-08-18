-- Luminara BTC 001: identity, sessions, consent and audit only.
-- Dedicated BTC database: no TON, payment, subscription, referral or points tables.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  TEXT,
  locale        TEXT NOT NULL DEFAULT 'en',
  birthday      DATE,
  is_test       BOOLEAN NOT NULL DEFAULT FALSE,
  auth_version  INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'suspended', 'deleted')),
  -- BTC has no TON activation gate. Existing account code checks this column
  -- before profile edits, so a BTC account is active from creation.
  activated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS identities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider    TEXT NOT NULL CHECK (provider IN ('telegram', 'bitcoin')),
  network     TEXT NOT NULL DEFAULT 'none',
  external_id TEXT NOT NULL,
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, network, external_id)
);
CREATE INDEX IF NOT EXISTS idx_btc_identities_user ON identities(user_id);

CREATE TABLE IF NOT EXISTS roles (
  id   SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL CHECK (name IN ('user', 'moderator', 'admin', 'superadmin'))
);
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);
INSERT INTO roles(name) VALUES ('user'), ('moderator'), ('admin'), ('superadmin')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_hash      TEXT NOT NULL UNIQUE,
  family_id         UUID,
  replaced_by       UUID REFERENCES sessions(id) ON DELETE SET NULL,
  device            TEXT,
  ip                INET,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ NOT NULL,
  revoked_at        TIMESTAMPTZ,
  rotated_at        TIMESTAMPTZ,
  revocation_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_btc_sessions_user_active
  ON sessions(user_id, device) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_btc_sessions_family
  ON sessions(family_id) WHERE family_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS auth_challenges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT NOT NULL CHECK (provider IN ('bitcoin')),
  network     TEXT NOT NULL,
  ref         TEXT NOT NULL,
  nonce       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind           TEXT NOT NULL,
  policy_version TEXT NOT NULL DEFAULT '1.0',
  source         TEXT,
  granted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at     TIMESTAMPTZ NOT NULL,
  revoked_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_btc_consents_user ON consents(user_id, kind);

CREATE TABLE IF NOT EXISTS audit_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_id_snapshot UUID,
  action            TEXT NOT NULL,
  target            TEXT,
  meta              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_btc_audit_created ON audit_log(created_at DESC);
