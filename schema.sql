
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Allow re-running after helper signature changes (Postgres cannot REPLACE return type).
DROP FUNCTION IF EXISTS afresh_drop_not_null_if_needed(TEXT, TEXT);
DROP FUNCTION IF EXISTS afresh_add_constraint_if_missing(TEXT, TEXT);
DROP FUNCTION IF EXISTS afresh_add_column_if_missing(TEXT, TEXT, TEXT);

-- Add a column only when the table exists but the column does not (upgrade path).
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

-- Relax NOT NULL only when the column is still required (no row updates).
CREATE OR REPLACE FUNCTION afresh_drop_not_null_if_needed(
  p_table TEXT,
  p_column TEXT
) RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = p_table
  ) THEN
    RETURN 'skip (no table): ' || p_table;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table
      AND column_name = p_column
      AND is_nullable = 'NO'
  ) THEN
    RETURN 'skip (already nullable or missing): ' || p_table || '.' || p_column;
  END IF;
  EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP NOT NULL', p_table, p_column);
  RETURN 'ok: ' || p_table || '.' || p_column;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'error: ' || p_table || '.' || p_column || ' — ' || SQLERRM;
END;
$$;

-- Run DDL only if the constraint/index is not already present (any name).
CREATE OR REPLACE FUNCTION afresh_add_constraint_if_missing(
  p_constraint TEXT,
  p_sql TEXT
) RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = p_constraint) THEN
    RETURN 'skip (exists): ' || p_constraint;
  END IF;
  BEGIN
    EXECUTE p_sql;
    RETURN 'ok: ' || p_constraint;
  EXCEPTION
    WHEN duplicate_object THEN
      RETURN 'skip (duplicate): ' || p_constraint;
    WHEN duplicate_table THEN
      RETURN 'skip (duplicate table): ' || p_constraint;
    WHEN unique_violation THEN
      RETURN 'warn (duplicate rows — clean data then re-run): ' || p_constraint;
    WHEN OTHERS THEN
      RETURN 'error: ' || p_constraint || ' — ' || SQLERRM;
  END;
END;
$$;

-- -----------------------------------------------------------------------------
-- ENUMS (create only if missing)
-- -----------------------------------------------------------------------------

DO $$ BEGIN CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE product_badge AS ENUM ('none', 'new', 'limited'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE cart_status AS ENUM ('active', 'merged', 'abandoned', 'converted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE inquiry_type AS ENUM ('press', 'collaboration', 'wholesale', 'support', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE marquee_direction AS ENUM ('forward', 'reverse'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE editorial_layout AS ENUM ('featured', 'card', 'mini'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE admin_role AS ENUM ('superadmin', 'editor', 'viewer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- Shared: timestamps helper
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Media library (images for any section)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS media_assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name     TEXT NOT NULL,
  url           TEXT NOT NULL,
  alt_text      TEXT,
  width         INTEGER,
  height        INTEGER,
  mime_type     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_media_assets_updated_at ON media_assets;
CREATE TRIGGER trg_media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Admin users (studio / admin panel)
-- -----------------------------------------------------------------------------

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

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON admin_users;
CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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

-- -----------------------------------------------------------------------------
-- Global site settings (SEO, brand, currency)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS site_settings (
  id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brand_name      TEXT NOT NULL DEFAULT 'AFRESH',
  site_title      TEXT NOT NULL DEFAULT 'AFRESH — Global Fashion Movement Born From Africa',
  meta_description TEXT,
  logo_media_id   UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  currency_code   CHAR(3) NOT NULL DEFAULT 'NGN',
  currency_symbol TEXT NOT NULL DEFAULT '₦',
  season_label    TEXT NOT NULL DEFAULT 'SS/25',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- HERO (#hero)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hero_section (
  id                SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  background_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  background_url    TEXT, -- fallback if no media row
  tagline           TEXT NOT NULL DEFAULT 'Global Fashion Movement — Born From Africa',
  title             TEXT NOT NULL DEFAULT 'AFRESH',
  subtitle          TEXT NOT NULL DEFAULT 'Where heritage meets the future. Fashion as identity, culture as currency.',
  cta_primary_label TEXT NOT NULL DEFAULT 'Explore Collections',
  cta_primary_href  TEXT NOT NULL DEFAULT '#collections',
  cta_secondary_label TEXT NOT NULL DEFAULT 'View Lookbook',
  cta_secondary_href  TEXT NOT NULL DEFAULT '#lookbook',
  side_label        TEXT NOT NULL DEFAULT 'SS/25',
  scroll_label      TEXT NOT NULL DEFAULT 'Scroll',
  status            content_status NOT NULL DEFAULT 'published',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_hero_section_updated_at ON hero_section;
CREATE TRIGGER trg_hero_section_updated_at
  BEFORE UPDATE ON hero_section
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS hero_background_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url   TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hero_background_images_sort ON hero_background_images(sort_order);

-- -----------------------------------------------------------------------------
-- MARQUEE bands (two scrolling strips on landing page)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS marquee_bands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE, -- e.g. 'primary', 'secondary'
  direction   marquee_direction NOT NULL DEFAULT 'forward',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  status      content_status NOT NULL DEFAULT 'published',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marquee_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id     UUID NOT NULL REFERENCES marquee_bands(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  status      content_status NOT NULL DEFAULT 'published',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marquee_items_band ON marquee_items(band_id, sort_order);

DROP TRIGGER IF EXISTS trg_marquee_bands_updated_at ON marquee_bands;
CREATE TRIGGER trg_marquee_bands_updated_at
  BEFORE UPDATE ON marquee_bands FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_marquee_items_updated_at ON marquee_items;
CREATE TRIGGER trg_marquee_items_updated_at
  BEFORE UPDATE ON marquee_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- ABOUT / MANIFESTO (#about)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS about_section (
  id                  SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  section_label       TEXT NOT NULL DEFAULT 'Our Manifesto',
  heading_line_1      TEXT NOT NULL DEFAULT 'WE DON''T JUST',
  heading_line_2      TEXT NOT NULL DEFAULT 'MAKE CLOTHES',
  lead_paragraph      TEXT NOT NULL,
  body_paragraph_1    TEXT NOT NULL,
  body_paragraph_2    TEXT NOT NULL,
  cta_label           TEXT NOT NULL DEFAULT 'Read Our Full Story',
  cta_href            TEXT NOT NULL DEFAULT '#membership',
  status              content_status NOT NULL DEFAULT 'published',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS about_stats (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value_numeric INTEGER, -- NULL when symbolic (e.g. infinity)
  is_symbolic   BOOLEAN NOT NULL DEFAULT FALSE,
  symbol_text   TEXT, -- e.g. '∞'
  label         TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  status        content_status NOT NULL DEFAULT 'published',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT about_stats_value_check CHECK (
    (is_symbolic = TRUE AND symbol_text IS NOT NULL)
    OR (is_symbolic = FALSE AND value_numeric IS NOT NULL)
  ),
  CONSTRAINT uq_about_stats_label UNIQUE (label)
);

DROP TRIGGER IF EXISTS trg_about_section_updated_at ON about_section;
CREATE TRIGGER trg_about_section_updated_at
  BEFORE UPDATE ON about_section FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_about_stats_updated_at ON about_stats;
CREATE TRIGGER trg_about_stats_updated_at
  BEFORE UPDATE ON about_stats FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- COLLECTIONS (#collections)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS collections_section (
  id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  section_label   TEXT NOT NULL DEFAULT 'SS/25',
  heading         TEXT NOT NULL DEFAULT 'COLLECTIONS',
  view_all_label  TEXT NOT NULL DEFAULT 'View All',
  view_all_href   TEXT NOT NULL DEFAULT '#shop',
  status          content_status NOT NULL DEFAULT 'published',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter         TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  image_media_id  UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  image_url       TEXT,
  slug            TEXT UNIQUE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          content_status NOT NULL DEFAULT 'published',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_sort ON collections(sort_order) WHERE status = 'published';

DROP TRIGGER IF EXISTS trg_collections_section_updated_at ON collections_section;
CREATE TRIGGER trg_collections_section_updated_at
  BEFORE UPDATE ON collections_section FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_collections_updated_at ON collections;
CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- LOOKBOOK (#lookbook)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS lookbook_section (
  id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  section_label   TEXT NOT NULL DEFAULT 'Editorial',
  heading         TEXT NOT NULL DEFAULT 'LOOKBOOK',
  description     TEXT NOT NULL DEFAULT 'Each frame is a chapter. Each outfit, a narrative. Scroll through our visual story — campaign by campaign.',
  status          content_status NOT NULL DEFAULT 'published',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lookbook_looks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label           TEXT NOT NULL, -- e.g. 'Look 01'
  image_media_id  UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  image_url       TEXT,
  campaign_slug   TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          content_status NOT NULL DEFAULT 'published',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lookbook_looks_label UNIQUE (label)
);

CREATE INDEX IF NOT EXISTS idx_lookbook_looks_sort ON lookbook_looks(sort_order);

DROP TRIGGER IF EXISTS trg_lookbook_section_updated_at ON lookbook_section;
CREATE TRIGGER trg_lookbook_section_updated_at
  BEFORE UPDATE ON lookbook_section FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_lookbook_looks_updated_at ON lookbook_looks;
CREATE TRIGGER trg_lookbook_looks_updated_at
  BEFORE UPDATE ON lookbook_looks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- CINEMATIC break (full-width quote + play button)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cinematic_section (
  id                  SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  image_media_id      UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  image_url           TEXT,
  quote               TEXT NOT NULL DEFAULT 'Fashion is not about clothes. It''s about a vision of life.',
  attribution         TEXT NOT NULL DEFAULT '— The AFRESH Philosophy',
  film_url            TEXT, -- video URL when ready
  toast_message       TEXT NOT NULL DEFAULT 'Fashion film coming soon',
  status              content_status NOT NULL DEFAULT 'published',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_cinematic_section_updated_at ON cinematic_section;
CREATE TRIGGER trg_cinematic_section_updated_at
  BEFORE UPDATE ON cinematic_section FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS cinematic_videos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT,
  video_url       TEXT,
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
  BEFORE UPDATE ON cinematic_videos FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- SHOP (#shop) — products, categories, variants
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS shop_section (
  id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  section_label   TEXT NOT NULL DEFAULT 'Curated',
  heading         TEXT NOT NULL DEFAULT 'THE SHOP',
  view_all_label  TEXT NOT NULL DEFAULT 'View All Products',
  view_all_href   TEXT NOT NULL DEFAULT '#',
  status          content_status NOT NULL DEFAULT 'published',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE, -- tops, bottoms, outerwear, accessories
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  status      content_status NOT NULL DEFAULT 'published',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id       UUID NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
  collection_id     UUID REFERENCES collections(id) ON DELETE SET NULL,
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  description       TEXT,
  price_amount      NUMERIC(12, 2) NOT NULL CHECK (price_amount >= 0),
  compare_at_amount NUMERIC(12, 2) CHECK (compare_at_amount IS NULL OR compare_at_amount >= 0),
  badge             product_badge NOT NULL DEFAULT 'none',
  stock_quantity    INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sku               TEXT UNIQUE,
  image_media_id    UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  image_url         TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  status            content_status NOT NULL DEFAULT 'draft',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_color_swatches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  hex_color   CHAR(7) NOT NULL CHECK (hex_color ~ '^#[0-9A-Fa-f]{6}$'),
  label       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_product_color_swatches UNIQUE (product_id, hex_color)
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_swatches_product ON product_color_swatches(product_id);

CREATE TABLE IF NOT EXISTS product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, sort_order);

DROP TRIGGER IF EXISTS trg_shop_section_updated_at ON shop_section;
CREATE TRIGGER trg_shop_section_updated_at
  BEFORE UPDATE ON shop_section FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_product_categories_updated_at ON product_categories;
CREATE TRIGGER trg_product_categories_updated_at
  BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- NEXT DROP (#drops)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS drops (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active             BOOLEAN NOT NULL DEFAULT FALSE,
  section_label         TEXT NOT NULL DEFAULT 'Limited Edition',
  heading               TEXT NOT NULL DEFAULT 'NEXT DROP',
  title                 TEXT NOT NULL DEFAULT 'Ancestral Code',
  subtitle              TEXT NOT NULL,
  pieces_worldwide      INTEGER NOT NULL DEFAULT 50 CHECK (pieces_worldwide > 0),
  drop_at               TIMESTAMPTZ NOT NULL,
  background_media_id   UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  background_url        TEXT,
  cta_primary_label     TEXT NOT NULL DEFAULT 'Get Early Access',
  cta_secondary_label   TEXT NOT NULL DEFAULT 'Unlock Private Collection',
  footnote              TEXT NOT NULL DEFAULT 'Invite-only • VIP members get 24hr early access',
  status                content_status NOT NULL DEFAULT 'published',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active drop at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_drops_one_active ON drops ((TRUE)) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS drop_early_access (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id     UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (drop_id, email)
);

DROP TRIGGER IF EXISTS trg_drops_updated_at ON drops;
CREATE TRIGGER trg_drops_updated_at
  BEFORE UPDATE ON drops FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- COMMUNITY (#community)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS community_section (
  id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  section_label   TEXT NOT NULL DEFAULT 'The Movement',
  heading         TEXT NOT NULL DEFAULT 'COMMUNITY',
  description     TEXT NOT NULL,
  instagram_handle TEXT NOT NULL DEFAULT '@afresh',
  status          content_status NOT NULL DEFAULT 'published',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle          TEXT NOT NULL,
  image_media_id  UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  image_url       TEXT,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_large_tile   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          content_status NOT NULL DEFAULT 'published',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_community_posts_handle UNIQUE (handle)
);

CREATE TABLE IF NOT EXISTS collaborators (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  role            TEXT NOT NULL,
  avatar_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  avatar_url      TEXT,
  is_wide_tile    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          content_status NOT NULL DEFAULT 'published',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_collaborators_name UNIQUE (name)
);

DROP TRIGGER IF EXISTS trg_community_section_updated_at ON community_section;
CREATE TRIGGER trg_community_section_updated_at
  BEFORE UPDATE ON community_section FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_community_posts_updated_at ON community_posts;
CREATE TRIGGER trg_community_posts_updated_at
  BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_collaborators_updated_at ON collaborators;
CREATE TRIGGER trg_collaborators_updated_at
  BEFORE UPDATE ON collaborators FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- EDITORIAL (#editorial)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS editorial_section (
  id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  section_label   TEXT NOT NULL DEFAULT 'Fashion Media',
  heading         TEXT NOT NULL DEFAULT 'EDITORIAL',
  read_all_label  TEXT NOT NULL DEFAULT 'Read All',
  read_all_href   TEXT NOT NULL DEFAULT '#',
  status          content_status NOT NULL DEFAULT 'published',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS editorial_articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout          editorial_layout NOT NULL DEFAULT 'card',
  tag             TEXT NOT NULL,
  title           TEXT NOT NULL,
  excerpt         TEXT,
  meta_text       TEXT, -- '5 min read', 'Watch now'
  href            TEXT,
  image_media_id  UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  image_url       TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          content_status NOT NULL DEFAULT 'published',
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_editorial_articles_title UNIQUE (title)
);

CREATE INDEX IF NOT EXISTS idx_editorial_articles_layout ON editorial_articles(layout, sort_order);

DROP TRIGGER IF EXISTS trg_editorial_section_updated_at ON editorial_section;
CREATE TRIGGER trg_editorial_section_updated_at
  BEFORE UPDATE ON editorial_section FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_editorial_articles_updated_at ON editorial_articles;
CREATE TRIGGER trg_editorial_articles_updated_at
  BEFORE UPDATE ON editorial_articles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- MEMBERSHIP / VIP (#membership)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS membership_section (
  id                  SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  section_label       TEXT NOT NULL DEFAULT 'Exclusive Access',
  heading_line_1      TEXT NOT NULL DEFAULT 'JOIN THE',
  heading_line_2      TEXT NOT NULL DEFAULT 'INNER CIRCLE',
  heading_line_2_gold BOOLEAN NOT NULL DEFAULT TRUE,
  description         TEXT NOT NULL,
  signup_placeholder  TEXT NOT NULL DEFAULT 'Your email address',
  signup_button_label TEXT NOT NULL DEFAULT 'Join VIP',
  footnote            TEXT NOT NULL DEFAULT 'Free to join • No spam • Unsubscribe anytime',
  background_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  background_url      TEXT,
  status              content_status NOT NULL DEFAULT 'published',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS membership_perks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon_key    TEXT NOT NULL, -- lucide icon name: clock, lock, sparkles, gift
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  status      content_status NOT NULL DEFAULT 'published',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_membership_perks_title UNIQUE (title)
);

CREATE TABLE IF NOT EXISTS vip_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  source        TEXT NOT NULL DEFAULT 'landing', -- landing, admin, import
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vip_members_joined ON vip_members(joined_at DESC);

-- Admin alerts (VIP signups, campaign sends, etc.)
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

-- VIP subscription / offer emails composed by admin
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

DROP TRIGGER IF EXISTS trg_membership_section_updated_at ON membership_section;
CREATE TRIGGER trg_membership_section_updated_at
  BEFORE UPDATE ON membership_section FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_membership_perks_updated_at ON membership_perks;
CREATE TRIGGER trg_membership_perks_updated_at
  BEFORE UPDATE ON membership_perks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- CONTACT (#contact)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS contact_section (
  id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  section_label   TEXT NOT NULL DEFAULT 'Get In Touch',
  heading         TEXT NOT NULL DEFAULT 'CONTACT',
  intro_text      TEXT NOT NULL,
  email           TEXT NOT NULL DEFAULT 'afreshfashions@gmail.com',
  location        TEXT NOT NULL DEFAULT 'Lagos, Nigeria',
  shipping_note   TEXT NOT NULL DEFAULT 'Global Shipping Available',
  status          content_status NOT NULL DEFAULT 'published',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  inquiry_type  inquiry_type NOT NULL DEFAULT 'other',
  message       TEXT NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  admin_notes   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_unread ON contact_submissions(is_read) WHERE is_read = FALSE;

DROP TRIGGER IF EXISTS trg_contact_section_updated_at ON contact_section;
CREATE TRIGGER trg_contact_section_updated_at
  BEFORE UPDATE ON contact_section FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- FOOTER
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS footer_content (
  id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  tagline         TEXT NOT NULL DEFAULT 'A global fashion movement born from Africa. Fashion is armor. Style is language. Culture is currency.',
  copyright_text  TEXT NOT NULL DEFAULT '© 2025 AFRESH. All rights reserved.',
  cities_line     TEXT NOT NULL DEFAULT 'Lagos • Accra • Nairobi • London • NYC',
  stealth_ref     TEXT NOT NULL DEFAULT '· ref. ss25/afr', -- admin link label in footer
  status          content_status NOT NULL DEFAULT 'published',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS footer_link_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  status      content_status NOT NULL DEFAULT 'published',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_footer_link_groups_title UNIQUE (title)
);

CREATE TABLE IF NOT EXISTS footer_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES footer_link_groups(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  href        TEXT NOT NULL DEFAULT '#',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  status      content_status NOT NULL DEFAULT 'published',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform    TEXT NOT NULL, -- instagram, twitter, youtube, tiktok
  url         TEXT NOT NULL DEFAULT '#',
  icon_key    TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  status      content_status NOT NULL DEFAULT 'published',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_social_links_platform UNIQUE (platform)
);

DROP TRIGGER IF EXISTS trg_footer_content_updated_at ON footer_content;
CREATE TRIGGER trg_footer_content_updated_at
  BEFORE UPDATE ON footer_content FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_footer_link_groups_updated_at ON footer_link_groups;
CREATE TRIGGER trg_footer_link_groups_updated_at
  BEFORE UPDATE ON footer_link_groups FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_footer_links_updated_at ON footer_links;
CREATE TRIGGER trg_footer_links_updated_at
  BEFORE UPDATE ON footer_links FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_social_links_updated_at ON social_links;
CREATE TRIGGER trg_social_links_updated_at
  BEFORE UPDATE ON social_links FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- FOOTER HELP POPUPS (Shipping, Size Guide, Contact, FAQ, Privacy)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS help_pages (
  slug              TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  body              TEXT NOT NULL DEFAULT '',
  diagram_url       TEXT,
  diagram_caption   TEXT,
  contact_email     TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  status            content_status NOT NULL DEFAULT 'published',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_help_pages_updated_at ON help_pages;
CREATE TRIGGER trg_help_pages_updated_at
  BEFORE UPDATE ON help_pages FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- CUSTOMERS (optional account; guests use email on order)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE,
  full_name     TEXT,
  phone         TEXT,
  is_vip        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- CARTS & ORDERS (shop bag)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS carts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token   TEXT NOT NULL UNIQUE, -- browser session / anonymous id
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  status          cart_status NOT NULL DEFAULT 'active',
  currency_code   CHAR(3) NOT NULL DEFAULT 'NGN',
  item_count      INTEGER NOT NULL DEFAULT 0,
  subtotal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  expires_at      TIMESTAMPTZ,
  converted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id         UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price      NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  product_name    TEXT NOT NULL, -- snapshot at add-to-cart
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number      TEXT NOT NULL UNIQUE,
  cart_id           UUID REFERENCES carts(id) ON DELETE SET NULL,
  customer_id       UUID REFERENCES customers(id) ON DELETE SET NULL,
  email             TEXT NOT NULL,
  status            order_status NOT NULL DEFAULT 'pending',
  currency_code     CHAR(3) NOT NULL DEFAULT 'NGN',
  subtotal_amount   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  shipping_amount   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_amount        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  shipping_name     TEXT,
  shipping_address  JSONB,
  notes             TEXT,
  placed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  sku             TEXT,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price      NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  line_total      NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_carts_session ON carts(session_token);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

DROP TRIGGER IF EXISTS trg_carts_updated_at ON carts;
CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_cart_items_updated_at ON cart_items;
CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Recalculate cart totals when items change
CREATE OR REPLACE FUNCTION refresh_cart_totals(p_cart_id UUID)
RETURNS VOID AS $$
DECLARE
  v_count INTEGER;
  v_subtotal NUMERIC(12, 2);
BEGIN
  SELECT COALESCE(SUM(quantity), 0), COALESCE(SUM(unit_price * quantity), 0)
  INTO v_count, v_subtotal
  FROM cart_items
  WHERE cart_id = p_cart_id;

  UPDATE carts
  SET item_count = v_count,
      subtotal_amount = v_subtotal,
      updated_at = NOW()
  WHERE id = p_cart_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_cart_items_refresh_cart()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_cart_totals(COALESCE(NEW.cart_id, OLD.cart_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cart_items_after_change ON cart_items;
CREATE TRIGGER trg_cart_items_after_change
  AFTER INSERT OR UPDATE OR DELETE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION trg_cart_items_refresh_cart();

-- -----------------------------------------------------------------------------
-- ORDER number generator
-- -----------------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'AFR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_order_number ON orders;
CREATE TRIGGER trg_orders_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- -----------------------------------------------------------------------------
-- SCHEMA SYNC: columns & constraints on existing databases (re-run safe)
-- -----------------------------------------------------------------------------

DO $afresh_sync$
BEGIN
  PERFORM afresh_add_column_if_missing('admin_users', 'full_name', 'TEXT');
  PERFORM afresh_add_column_if_missing('admin_users', 'role', 'admin_role NOT NULL DEFAULT ''editor''');
  PERFORM afresh_add_column_if_missing('admin_users', 'is_active', 'BOOLEAN NOT NULL DEFAULT TRUE');
  PERFORM afresh_add_column_if_missing('admin_users', 'last_login_at', 'TIMESTAMPTZ');
  PERFORM afresh_add_column_if_missing('admin_users', 'created_at', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()');
  PERFORM afresh_add_column_if_missing('admin_users', 'updated_at', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()');
  PERFORM afresh_add_column_if_missing('cinematic_videos', 'file_size_bytes', 'BIGINT');
  PERFORM afresh_add_column_if_missing('cinematic_videos', 'mime_type', 'TEXT');
  -- Draft video slots: allow NULL video_url; existing URLs are unchanged.
  PERFORM afresh_drop_not_null_if_needed('cinematic_videos', 'video_url');
  PERFORM afresh_add_column_if_missing('vip_email_campaigns', 'recipient_count', 'INTEGER NOT NULL DEFAULT 0');
  PERFORM afresh_add_column_if_missing('vip_email_campaigns', 'sent_at', 'TIMESTAMPTZ');
  PERFORM afresh_add_column_if_missing('admin_notifications', 'metadata', 'JSONB NOT NULL DEFAULT ''{}''');
  PERFORM afresh_add_column_if_missing('vip_members', 'unsubscribed_at', 'TIMESTAMPTZ');
  PERFORM afresh_add_column_if_missing('vip_members', 'source', 'TEXT NOT NULL DEFAULT ''landing''');
  PERFORM afresh_add_column_if_missing('orders', 'payment_method', 'TEXT');
  PERFORM afresh_add_column_if_missing('orders', 'payment_status', 'TEXT NOT NULL DEFAULT ''unpaid''');
  PERFORM afresh_add_column_if_missing('orders', 'paystack_reference', 'TEXT');
  PERFORM afresh_add_column_if_missing('orders', 'phone', 'TEXT');
  PERFORM afresh_add_column_if_missing('orders', 'full_name', 'TEXT');
  PERFORM afresh_add_column_if_missing('orders', 'customer_notes', 'TEXT');
  PERFORM afresh_add_column_if_missing('orders', 'expected_delivery_at', 'TIMESTAMPTZ');
  PERFORM afresh_add_column_if_missing('orders', 'delivery_message', 'TEXT');
  PERFORM afresh_add_column_if_missing('orders', 'manual_paid_at', 'TIMESTAMPTZ');
  PERFORM afresh_add_column_if_missing('order_items', 'product_image_url', 'TEXT');
  PERFORM afresh_add_column_if_missing('order_items', 'product_slug', 'TEXT');

  PERFORM afresh_add_constraint_if_missing(
    'uq_about_stats_label',
    'ALTER TABLE about_stats ADD CONSTRAINT uq_about_stats_label UNIQUE (label)'
  );
  PERFORM afresh_add_constraint_if_missing(
    'uq_lookbook_looks_label',
    'ALTER TABLE lookbook_looks ADD CONSTRAINT uq_lookbook_looks_label UNIQUE (label)'
  );
  PERFORM afresh_add_constraint_if_missing(
    'uq_community_posts_handle',
    'ALTER TABLE community_posts ADD CONSTRAINT uq_community_posts_handle UNIQUE (handle)'
  );
  PERFORM afresh_add_constraint_if_missing(
    'uq_collaborators_name',
    'ALTER TABLE collaborators ADD CONSTRAINT uq_collaborators_name UNIQUE (name)'
  );
  PERFORM afresh_add_constraint_if_missing(
    'uq_membership_perks_title',
    'ALTER TABLE membership_perks ADD CONSTRAINT uq_membership_perks_title UNIQUE (title)'
  );
  PERFORM afresh_add_constraint_if_missing(
    'uq_editorial_articles_title',
    'ALTER TABLE editorial_articles ADD CONSTRAINT uq_editorial_articles_title UNIQUE (title)'
  );
  PERFORM afresh_add_constraint_if_missing(
    'uq_social_links_platform',
    'ALTER TABLE social_links ADD CONSTRAINT uq_social_links_platform UNIQUE (platform)'
  );
  PERFORM afresh_add_constraint_if_missing(
    'uq_footer_link_groups_title',
    'ALTER TABLE footer_link_groups ADD CONSTRAINT uq_footer_link_groups_title UNIQUE (title)'
  );
  PERFORM afresh_add_constraint_if_missing(
    'uq_product_color_swatches',
    'ALTER TABLE product_color_swatches ADD CONSTRAINT uq_product_color_swatches UNIQUE (product_id, hex_color)'
  );
  PERFORM afresh_add_constraint_if_missing(
    'collections_slug_key',
    'ALTER TABLE collections ADD CONSTRAINT collections_slug_key UNIQUE (slug)'
  );
  PERFORM afresh_add_constraint_if_missing(
    'marquee_bands_slug_key',
    'ALTER TABLE marquee_bands ADD CONSTRAINT marquee_bands_slug_key UNIQUE (slug)'
  );
  PERFORM afresh_add_constraint_if_missing(
    'product_categories_slug_key',
    'ALTER TABLE product_categories ADD CONSTRAINT product_categories_slug_key UNIQUE (slug)'
  );
  PERFORM afresh_add_constraint_if_missing(
    'products_slug_key',
    'ALTER TABLE products ADD CONSTRAINT products_slug_key UNIQUE (slug)'
  );
END
$afresh_sync$;

-- -----------------------------------------------------------------------------
-- SEED: default content (idempotent — skips rows that already exist)
-- -----------------------------------------------------------------------------

INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO hero_section (id, background_url, tagline, title, subtitle)
VALUES (
  1,
  'https://picsum.photos/seed/afresh-hero-dark/1920/1080',
  'Global Fashion Movement — Born From Africa',
  'AFRESH',
  'Where heritage meets the future. Fashion as identity, culture as currency.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hero_background_images (image_url, sort_order)
SELECT background_url, 0
FROM hero_section
WHERE id = 1
  AND background_url IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM hero_background_images LIMIT 1);

INSERT INTO about_section (id, lead_paragraph, body_paragraph_1, body_paragraph_2)
VALUES (
  1,
  'Born from the pulse of African culture, forged in futuristic vision. Every thread tells a story. Every collection is a movement.',
  'We are not a brand — we are a belief. That fashion is armor. That style is language. That culture is currency. People buy identity, emotion, belonging — not just clothes. AFRESH exists at the intersection of heritage and tomorrow, creating garments that carry the weight of culture and the speed of the future.',
  'Our creative philosophy draws from the streets of Lagos, the energy of Accra, the innovation of Nairobi — filtered through a futuristic lens that speaks to the global youth. This is not a Nigerian clothing website. This is a global fashion movement born from Africa.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO about_stats (value_numeric, is_symbolic, symbol_text, label, sort_order) VALUES
  (47, FALSE, NULL, 'Countries Reached', 1),
  (12, FALSE, NULL, 'Collections Dropped', 2),
  (25, FALSE, NULL, 'Global Collaborators', 3),
  (NULL, TRUE, '∞', 'Cultural Impact', 4)
ON CONFLICT (label) DO NOTHING;

INSERT INTO collections_section (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO collections (chapter, title, description, image_url, slug, sort_order) VALUES
  ('Chapter I', 'HERITAGE FUTURISM', 'Where ancestral patterns meet tomorrow''s silhouettes. Traditional textiles reimagined through a futuristic lens.', 'https://picsum.photos/seed/afresh-col1/600/800', 'heritage-futurism', 1),
  ('Chapter II', 'NEO LAGOS', 'Street energy distilled into premium form. The heartbeat of the city, woven into every piece.', 'https://picsum.photos/seed/afresh-col2/600/800', 'neo-lagos', 2),
  ('Chapter III', 'SAHELI NOIR', 'Dark elegance rooted in Saharan mystery. Minimal silhouettes with maximum cultural depth.', 'https://picsum.photos/seed/afresh-col3/600/800', 'saheli-noir', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lookbook_section (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO lookbook_looks (label, image_url, sort_order) VALUES
  ('Look 01', 'https://picsum.photos/seed/look1/360/480', 1),
  ('Look 02', 'https://picsum.photos/seed/look2/360/480', 2),
  ('Look 03', 'https://picsum.photos/seed/look3/360/480', 3),
  ('Look 04', 'https://picsum.photos/seed/look4/360/480', 4),
  ('Look 05', 'https://picsum.photos/seed/look5/360/480', 5),
  ('Look 06', 'https://picsum.photos/seed/look6/360/480', 6)
ON CONFLICT (label) DO NOTHING;

INSERT INTO cinematic_section (id, image_url)
VALUES (1, 'https://picsum.photos/seed/afresh-cinematic/1920/900')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shop_section (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO product_categories (slug, name, sort_order) VALUES
  ('tops', 'Tops', 1),
  ('bottoms', 'Bottoms', 2),
  ('outerwear', 'Outerwear', 3),
  ('accessories', 'Accessories', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, slug, name, price_amount, badge, stock_quantity, image_url, sort_order, status)
SELECT c.id, 'heritage-bomber', 'Heritage Bomber', 185000, 'new', 24, 'https://picsum.photos/seed/prod1/400/530', 1, 'published'
FROM product_categories c WHERE c.slug = 'outerwear'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, slug, name, price_amount, badge, stock_quantity, image_url, sort_order, status)
SELECT c.id, 'neo-lagos-tee', 'Neo Lagos Tee', 65000, 'none', 120, 'https://picsum.photos/seed/prod2/400/530', 2, 'published'
FROM product_categories c WHERE c.slug = 'tops'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, slug, name, price_amount, badge, stock_quantity, image_url, sort_order, status)
SELECT c.id, 'saheli-trousers', 'Saheli Trousers', 120000, 'limited', 18, 'https://picsum.photos/seed/prod3/400/530', 3, 'published'
FROM product_categories c WHERE c.slug = 'bottoms'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, slug, name, price_amount, badge, stock_quantity, image_url, sort_order, status)
SELECT c.id, 'identity-chain', 'Identity Chain', 95000, 'none', 45, 'https://picsum.photos/seed/prod4/400/530', 4, 'published'
FROM product_categories c WHERE c.slug = 'accessories'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_color_swatches (product_id, hex_color, sort_order)
SELECT p.id, v.hex, v.ord FROM products p
JOIN (VALUES ('heritage-bomber', '#0A0A0A', 1), ('heritage-bomber', '#1E1E1E', 2), ('heritage-bomber', '#C8A96B', 3)) AS v(slug, hex, ord) ON p.slug = v.slug
ON CONFLICT (product_id, hex_color) DO NOTHING;

INSERT INTO product_color_swatches (product_id, hex_color, sort_order)
SELECT p.id, v.hex, v.ord FROM products p
JOIN (VALUES ('neo-lagos-tee', '#F5F5F5', 1), ('neo-lagos-tee', '#0A0A0A', 2)) AS v(slug, hex, ord) ON p.slug = v.slug
ON CONFLICT (product_id, hex_color) DO NOTHING;

INSERT INTO product_color_swatches (product_id, hex_color, sort_order)
SELECT p.id, v.hex, v.ord FROM products p
JOIN (VALUES ('saheli-trousers', '#2C2C2C', 1), ('saheli-trousers', '#D4C5A9', 2)) AS v(slug, hex, ord) ON p.slug = v.slug
ON CONFLICT (product_id, hex_color) DO NOTHING;

INSERT INTO product_color_swatches (product_id, hex_color, sort_order)
SELECT p.id, v.hex, v.ord FROM products p
JOIN (VALUES ('identity-chain', '#C8A96B', 1), ('identity-chain', '#BFC0C0', 2)) AS v(slug, hex, ord) ON p.slug = v.slug
ON CONFLICT (product_id, hex_color) DO NOTHING;

INSERT INTO drops (is_active, title, subtitle, pieces_worldwide, drop_at, background_url)
SELECT TRUE, 'Ancestral Code', 'The "Ancestral Code" Capsule — 50 Pieces Worldwide', 50, NOW() + INTERVAL '7 days', 'https://picsum.photos/seed/afresh-drop-bg/1920/1080'
WHERE NOT EXISTS (SELECT 1 FROM drops WHERE is_active = TRUE);

INSERT INTO community_section (id, description)
VALUES (1, 'This is what separates brands from clothing companies. Our community wears the culture. Tag @afresh to be featured.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO community_posts (handle, image_url, is_featured, is_large_tile, sort_order) VALUES
  ('@ade_style', 'https://picsum.photos/seed/comm1/400/400', FALSE, FALSE, 1),
  ('@neo.lagos', 'https://picsum.photos/seed/comm2/400/400', FALSE, FALSE, 2),
  ('@kofi.wears', 'https://picsum.photos/seed/comm3/400/400', FALSE, FALSE, 3),
  ('@zara_accra', 'https://picsum.photos/seed/comm4/400/400', FALSE, FALSE, 4),
  ('@afresh_official', 'https://picsum.photos/seed/comm5/800/800', TRUE, TRUE, 5),
  ('@amara.streets', 'https://picsum.photos/seed/comm6/400/400', FALSE, FALSE, 6),
  ('@drip.diary', 'https://picsum.photos/seed/comm7/400/400', FALSE, FALSE, 7),
  ('@naija.fits', 'https://picsum.photos/seed/comm8/400/400', FALSE, FALSE, 8),
  ('@sahel.noir', 'https://picsum.photos/seed/comm9/400/400', FALSE, FALSE, 9)
ON CONFLICT (handle) DO NOTHING;

INSERT INTO collaborators (name, role, avatar_url, is_wide_tile, sort_order) VALUES
  ('Ade Okafor', 'Photographer', 'https://picsum.photos/seed/collab1/100/100', FALSE, 1),
  ('Yemi Alade', 'Musician', 'https://picsum.photos/seed/collab2/100/100', FALSE, 2),
  ('Kofi Ansah', 'Stylist', 'https://picsum.photos/seed/collab3/100/100', FALSE, 3),
  ('Ngozi Eze', 'Creative Dir.', 'https://picsum.photos/seed/collab4/100/100', FALSE, 4),
  ('Ama Ata', 'Model', 'https://picsum.photos/seed/collab5/100/100', TRUE, 5)
ON CONFLICT (name) DO NOTHING;

INSERT INTO editorial_section (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO editorial_articles (layout, tag, title, excerpt, meta_text, image_url, sort_order) VALUES
  ('featured', 'Campaign Breakdown', 'DECONSTRUCTING HERITAGE FUTURISM: THE SS/25 CAMPAIGN',
   'An inside look at how we blended ancestral weaving techniques with futuristic silhouette engineering for our most ambitious collection yet.',
   '5 min read', 'https://picsum.photos/seed/edit1/800/500', 1),
  ('card', 'Style Guide', 'HOW TO STYLE THE HERITAGE BOMBER', NULL, NULL, 'https://picsum.photos/seed/edit2/400/300', 2),
  ('card', 'Interview', 'CONVERSATION WITH FOUNDER', NULL, NULL, 'https://picsum.photos/seed/edit3/400/300', 3),
  ('mini', 'Trend Analysis', 'The Rise of African Futurism in Global Fashion', NULL, '3 min read', 'https://picsum.photos/seed/edit4/100/100', 4),
  ('mini', 'Behind The Scenes', 'Making Of: Neo Lagos Campaign in Lagos', NULL, '4 min read', 'https://picsum.photos/seed/edit5/100/100', 5),
  ('mini', 'Fashion Film', '"Code" — A Short Fashion Film by AFRESH', NULL, 'Watch now', 'https://picsum.photos/seed/edit6/100/100', 6)
ON CONFLICT (title) DO NOTHING;

INSERT INTO membership_section (id, description, background_url)
VALUES (1, 'Membership has its privileges. Early access, private collections, VIP events, and a seat at the table of culture.', 'https://picsum.photos/seed/afresh-member/1920/1080')
ON CONFLICT (id) DO NOTHING;

INSERT INTO membership_perks (icon_key, title, description, sort_order) VALUES
  ('clock', '24hr Early Access', 'Shop drops before anyone else', 1),
  ('lock', 'Private Collections', 'Invite-only pieces', 2),
  ('sparkles', 'VIP Events', 'Fashion shows & private views', 3),
  ('gift', 'Exclusive Gifts', 'Member-only accessories', 4)
ON CONFLICT (title) DO NOTHING;

INSERT INTO contact_section (id, intro_text, email)
VALUES (1, 'For press, collaborations, wholesale inquiries, or just to connect with the movement.', 'afreshfashions@gmail.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO help_pages (slug, title, body, diagram_caption, contact_email, sort_order) VALUES
(
  'shipping-returns',
  'Shipping & Returns',
  'AFRESH ships worldwide from our fulfilment partners in Lagos and London.

Standard delivery: 5–10 business days (Africa & UK), 10–18 business days (Americas, EU, Asia).

Express delivery: 2–5 business days where available — selected at checkout.

Orders are processed within 1–2 business days. You will receive tracking once your package ships.

Returns & exchanges:
• Items must be unworn, unwashed, and with original tags attached.
• Request a return within 14 days of delivery.
• Sale pieces and limited drops are final sale unless faulty.
• Refunds are issued to the original payment method within 7–10 business days after we receive your return.

For return authorisation, email us with your order number and reason.',
  NULL,
  NULL,
  1
),
(
  'size-guide',
  'Size Guide',
  'AFRESH fits true to size with a relaxed, elevated street silhouette. When between sizes, we recommend sizing up for outerwear and staying true to size for tees and hoodies.

Measure yourself:
• Chest — around the fullest part, under arms.
• Waist — natural waistline.
• Hips — fullest part of seat.
• Length — shoulder seam to hem (tops) or waist to ankle (trousers).

Use the diagram and chart below. Still unsure? Contact us with your height and usual size — we will advise.',
  'Body measurement reference — chest, waist, hip, and length',
  NULL,
  2
),
(
  'contact-us',
  'Contact Us',
  'We respond within 24–48 hours on business days. For order issues, include your order number in the subject line.

Press, collaborations, wholesale, and styling enquiries are welcome — tell us about your project and timeline.',
  NULL,
  'afreshfashions@gmail.com',
  3
),
(
  'faq',
  'FAQ',
  'What is AFRESH?
A global fashion movement born from Africa — apparel, culture, and community in one house.

Do you ship internationally?
Yes. Rates and timelines are shown at checkout.

How do I join VIP?
Use the membership section on the homepage. VIP members get early access to drops and private offers.

How do I pay?
Card via Paystack where available, or manual bank transfer with confirmation by our team.

Can I cancel an order?
Contact us within 2 hours of placing your order. Once fulfilment begins, orders cannot be cancelled.

How do I care for my pieces?
Cold wash inside out, low tumble or line dry. Do not bleach. Steam or low iron on reverse.',
  NULL,
  NULL,
  4
),
(
  'privacy-policy',
  'Privacy Policy',
  'AFRESH respects your privacy. This policy explains how we collect and use information when you use our website, shop, or join VIP.

Information we collect:
• Contact details (name, email, phone) when you order or join VIP.
• Payment references from our payment partners (we do not store full card numbers).
• Usage data such as pages visited and device type, to improve the experience.

How we use your data:
• To fulfil orders and communicate about your purchases.
• To send marketing you have opted into (VIP and newsletters).
• To prevent fraud and comply with legal obligations.

We do not sell your personal data. We may share data with trusted processors (hosting, email, payments) under contract.

Your rights:
You may request access, correction, or deletion of your data by contacting us.

Updates:
We may update this policy; the latest version is always on this page.',
  NULL,
  NULL,
  5
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO footer_content (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO footer_link_groups (title, sort_order) VALUES
  ('Shop', 1), ('About', 2), ('Help', 3)
ON CONFLICT (title) DO NOTHING;

INSERT INTO footer_links (group_id, label, href, sort_order)
SELECT g.id, l.label, '#', l.ord
FROM footer_link_groups g
JOIN (VALUES
  ('Shop', 'New Arrivals', 1), ('Shop', 'Collections', 2), ('Shop', 'Lookbook', 3),
  ('Shop', 'Accessories', 4), ('Shop', 'Gift Cards', 5),
  ('About', 'Our Story', 1), ('About', 'Manifesto', 2), ('About', 'Collaborations', 3),
  ('About', 'Careers', 4), ('About', 'Press', 5),
  ('Help', 'Shipping & Returns', 1), ('Help', 'Size Guide', 2), ('Help', 'Contact Us', 3),
  ('Help', 'FAQ', 4), ('Help', 'Privacy Policy', 5)
) AS l(grp, label, ord) ON g.title = l.grp
WHERE NOT EXISTS (
  SELECT 1 FROM footer_links fl
  WHERE fl.group_id = g.id AND fl.label = l.label
);

INSERT INTO social_links (platform, icon_key, sort_order) VALUES
  ('instagram', 'instagram', 1),
  ('twitter', 'twitter', 2),
  ('youtube', 'youtube', 3),
  ('music', 'music', 4)
ON CONFLICT (platform) DO NOTHING;

INSERT INTO marquee_bands (slug, direction, sort_order) VALUES
  ('primary', 'forward', 1),
  ('secondary', 'reverse', 2)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO marquee_items (band_id, text, sort_order)
SELECT b.id, t.txt, t.ord FROM marquee_bands b
JOIN (VALUES
  ('primary', 'AFRESH', 1), ('primary', 'GLOBAL FASHION MOVEMENT', 2),
  ('primary', 'BORN FROM AFRICA', 3), ('primary', 'IDENTITY IS EVERYTHING', 4)
) AS t(band, txt, ord) ON b.slug = t.band
WHERE NOT EXISTS (SELECT 1 FROM marquee_items mi WHERE mi.band_id = b.id AND mi.text = t.txt);

INSERT INTO marquee_items (band_id, text, sort_order)
SELECT b.id, t.txt, t.ord FROM marquee_bands b
JOIN (VALUES
  ('secondary', 'FASHION IS ARMOR', 1), ('secondary', 'STYLE IS LANGUAGE', 2),
  ('secondary', 'CULTURE IS CURRENCY', 3), ('secondary', 'IDENTITY IS EVERYTHING', 4)
) AS t(band, txt, ord) ON b.slug = t.band
WHERE NOT EXISTS (SELECT 1 FROM marquee_items mi WHERE mi.band_id = b.id AND mi.text = t.txt);

-- Studio admin seed
INSERT INTO admin_users (email, password_hash, full_name, role) VALUES (
  'afreshfashions@gmail.com',
  '$2b$12$6vfCFG4LBxxFVZAJKQrOhenjVsr82cXg8YeAww4KjPylE4K8gLb8a',
  'Studio Admin',
  'superadmin'
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = TRUE;

INSERT INTO product_images (product_id, image_url, sort_order)
SELECT p.id, p.image_url, 0
FROM products p
WHERE p.image_url IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);

-- =============================================================================
-- Done — you should see this row if the full script completed
-- =============================================================================
SELECT 'AFRESH schema applied successfully' AS status, NOW() AS completed_at;

-- =============================================================================
-- TABLE MAP (admin ↔ landing page)
-- =============================================================================
-- hero_section          → #hero
-- about_section         → #about copy
-- about_stats           → #about counters
-- marquee_bands/items   → scrolling text strips
-- collections_section   → #collections header
-- collections           → collection cards
-- lookbook_section      → #lookbook header
-- lookbook_looks        → horizontal looks
-- cinematic_section     → quote + film break
-- shop_section          → #shop header
-- product_categories    → shop filters
-- products              → product grid
-- product_color_swatches→ color dots on cards
-- drops                 → #drops countdown
-- drop_early_access     → early access signups
-- community_section     → #community header
-- community_posts       → community grid
-- collaborators         → ambassadors row
-- editorial_section     → #editorial header
-- editorial_articles    → featured + cards + mini list
-- membership_section    → #membership
-- membership_perks      → perk cards
-- vip_members           → VIP signups
-- contact_section       → #contact info
-- contact_submissions   → contact form entries
-- footer_content        → footer brand + copyright
-- footer_link_groups/links → footer columns
-- social_links          → footer social icons
-- carts / cart_items    → shopping bag (session-based)
-- orders / order_items  → checkout
-- customers             → optional shopper accounts
-- admin_users           → admin panel auth
-- admin_notifications   → admin panel alerts (VIP signups, etc.)
-- vip_email_campaigns   → VIP subscription emails composed in admin
-- media_assets          → uploaded images (optional)
-- site_settings         → global brand/SEO/currency
-- cinematic_videos      → landscape films in cinematic section
