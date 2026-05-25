-- Idempotent: multiple landscape videos for cinematic section (safe to re-run)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS cinematic_videos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT,
  video_url       TEXT NOT NULL,
  poster_url      TEXT,
  file_size_bytes BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
  mime_type       TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          content_status NOT NULL DEFAULT 'published',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cinematic_videos_sort ON cinematic_videos(sort_order);

DROP TRIGGER IF EXISTS trg_cinematic_videos_updated_at ON cinematic_videos;
CREATE TRIGGER trg_cinematic_videos_updated_at
  BEFORE UPDATE ON cinematic_videos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
