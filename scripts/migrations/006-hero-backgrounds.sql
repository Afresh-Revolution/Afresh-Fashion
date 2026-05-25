-- Hero background slideshow images (managed in admin)
CREATE TABLE IF NOT EXISTS hero_background_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url   TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hero_background_images_sort ON hero_background_images(sort_order);

INSERT INTO hero_background_images (image_url, sort_order)
SELECT background_url, 0
FROM hero_section
WHERE id = 1
  AND background_url IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM hero_background_images LIMIT 1);

SELECT 'Migration 006 complete — hero background images ready' AS status, NOW() AS completed_at;
