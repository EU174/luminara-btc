-- Luminara BTC 002: non-commercial learning state.

CREATE TABLE IF NOT EXISTS insights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic       TEXT,
  body        TEXT NOT NULL,
  shared      BOOLEAN NOT NULL DEFAULT FALSE,
  status      TEXT NOT NULL DEFAULT 'private'
                CHECK (status IN ('private', 'pending', 'published', 'rejected')),
  reports     INTEGER NOT NULL DEFAULT 0 CHECK (reports >= 0),
  share_links JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_btc_insights_feed
  ON insights(topic, created_at DESC) WHERE status='published';
CREATE INDEX IF NOT EXISTS idx_btc_insights_user ON insights(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic           TEXT NOT NULL,
  scene_idx       INTEGER NOT NULL DEFAULT 0 CHECK (scene_idx >= 0),
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  completion_mode TEXT NOT NULL DEFAULT 'exact'
                    CHECK (completion_mode IN ('legacy', 'exact')),
  content_version TEXT,
  last_scene_idx  INTEGER CHECK (last_scene_idx IS NULL OR last_scene_idx >= 0),
  last_visited_at TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic)
);

CREATE TABLE IF NOT EXISTS lesson_scene_progress (
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic        TEXT NOT NULL,
  scene_key    TEXT NOT NULL,
  scene_idx    INTEGER NOT NULL CHECK (scene_idx >= 0),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic, scene_key),
  FOREIGN KEY (user_id, topic) REFERENCES lesson_progress(user_id, topic) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  topic_key   TEXT,
  correct     BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_btc_quiz_user_correct
  ON quiz_attempts(user_id) WHERE correct=TRUE;

CREATE TABLE IF NOT EXISTS user_activity (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day     DATE NOT NULL,
  seconds INTEGER NOT NULL DEFAULT 0 CHECK (seconds >= 0),
  PRIMARY KEY (user_id, day)
);
