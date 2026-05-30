-- Idempotent admin auth setup (safe to re-run)
-- Set ADMIN_SEED_PASSWORD in your environment before running, or change password after first login.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE admin_role AS ENUM ('superadmin', 'editor', 'viewer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT,
  role          admin_role NOT NULL DEFAULT 'editor',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  used_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(admin_user_id);

-- Upgrade existing admin_users tables (no changes to existing email/password rows)
CREATE OR REPLACE FUNCTION afresh_add_column_if_missing(
  p_table TEXT,
  p_column TEXT,
  p_definition TEXT
) RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = p_table
  ) THEN
    RETURN 'skip (no table): ' || p_table;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table AND column_name = p_column
  ) THEN
    RETURN 'skip (exists): ' || p_table || '.' || p_column;
  END IF;
  EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', p_table, p_column, p_definition);
  RETURN 'ok: ' || p_table || '.' || p_column;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'error: ' || p_table || '.' || p_column || ' — ' || SQLERRM;
END;
$$;

DO $sync$
BEGIN
  PERFORM afresh_add_column_if_missing('admin_users', 'full_name', 'TEXT');
  PERFORM afresh_add_column_if_missing('admin_users', 'role', 'admin_role NOT NULL DEFAULT ''editor''');
  PERFORM afresh_add_column_if_missing('admin_users', 'is_active', 'BOOLEAN NOT NULL DEFAULT TRUE');
  PERFORM afresh_add_column_if_missing('admin_users', 'last_login_at', 'TIMESTAMPTZ');
  PERFORM afresh_add_column_if_missing('admin_users', 'updated_at', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()');
END
$sync$;

INSERT INTO admin_users (email, password_hash, full_name, role)
VALUES (
  'williambosworth420@gmail.com',
  '$2b$12$qrqPgOGxYAywkdSWd9jjduTxsSbxjb8g3mktXUefcAuOZrW8ZuWeK',
  'Studio Admin',
  'superadmin'
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = TRUE;
