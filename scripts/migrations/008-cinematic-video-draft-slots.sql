-- Idempotent: allow draft cinematic video rows before upload (safe to re-run).
-- Does not modify existing video_url values — only relaxes the NOT NULL constraint.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cinematic_videos'
      AND column_name = 'video_url'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE cinematic_videos ALTER COLUMN video_url DROP NOT NULL;
  END IF;
END $$;
