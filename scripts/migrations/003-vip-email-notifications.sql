-- Idempotent: admin notifications + VIP subscription email campaigns (safe to re-run)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS admin_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread
  ON admin_notifications(created_at DESC) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS vip_email_campaigns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject           TEXT NOT NULL,
  headline          TEXT NOT NULL,
  intro             TEXT NOT NULL,
  price_line        TEXT,
  description       TEXT,
  perks             TEXT,
  cta_label         TEXT NOT NULL DEFAULT 'Explore the collection',
  cta_url           TEXT NOT NULL DEFAULT '/#shop',
  footer_note       TEXT,
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  recipient_count   INTEGER NOT NULL DEFAULT 0,
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_vip_email_campaigns_updated_at ON vip_email_campaigns;
CREATE TRIGGER trg_vip_email_campaigns_updated_at
  BEFORE UPDATE ON vip_email_campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
