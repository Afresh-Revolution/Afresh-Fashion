import { query } from "@/lib/db";

export async function loadHeroBackgroundUrls(): Promise<string[]> {
  const { rows } = await query<{ image_url: string }>(
    `SELECT image_url FROM hero_background_images ORDER BY sort_order ASC, created_at ASC`
  );
  return rows.map((r) => r.image_url);
}

export async function replaceHeroBackgrounds(urls: string[]) {
  await query(`DELETE FROM hero_background_images`);
  const cleaned = urls.map((u) => u.trim()).filter(Boolean);
  for (let i = 0; i < cleaned.length; i++) {
    await query(`INSERT INTO hero_background_images (image_url, sort_order) VALUES ($1, $2)`, [
      cleaned[i],
      i,
    ]);
  }
}

export function resolveHeroBackgroundUrls(
  backgroundUrl: string | null,
  galleryUrls?: string[]
): string[] {
  if (galleryUrls && galleryUrls.length > 0) return galleryUrls;
  if (backgroundUrl) return [backgroundUrl];
  return [];
}
