-- Idempotent: add admin_users columns expected by the app (safe to re-run).
-- Run this alone in Supabase if full schema.sql fails on admin_users.full_name.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE admin_role AS ENUM ('superadmin', 'editor', 'viewer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
  PERFORM afresh_add_column_if_missing('admin_users', 'created_at', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()');
END
$sync$;
