import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  loadHeroBackgroundUrls,
  replaceHeroBackgrounds,
  resolveHeroBackgroundUrls,
} from "@/lib/hero-images";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

export async function GET() {
  try {
    await requireAdmin();
    const [section, backgrounds] = await Promise.all([
      query(
        `SELECT background_url, tagline, title, subtitle, cta_primary_label, cta_primary_href,
                cta_secondary_label, cta_secondary_href, side_label, scroll_label, status
         FROM hero_section WHERE id = 1`
      ),
      query<{ id: string; image_url: string; sort_order: number }>(
        `SELECT id, image_url, sort_order FROM hero_background_images ORDER BY sort_order ASC, created_at ASC`
      ),
    ]);
    const row = section.rows[0];
    if (!row) {
      return NextResponse.json({ section: null, backgrounds: [] });
    }
    const urls = await loadHeroBackgroundUrls();
    return NextResponse.json({
      section: {
        ...row,
        background_urls: resolveHeroBackgroundUrls(row.background_url, urls),
      },
      backgrounds: backgrounds.rows,
    });
  } catch (err) {
    return adminError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (Array.isArray(body.background_urls)) {
      await replaceHeroBackgrounds(body.background_urls);
      const first = body.background_urls[0] ?? null;
      await query(`UPDATE hero_section SET background_url = $2 WHERE id = 1`, [1, first]);
    }

    const { rows } = await query(
      `UPDATE hero_section SET
         tagline = COALESCE($2, tagline),
         title = COALESCE($3, title),
         subtitle = COALESCE($4, subtitle),
         cta_primary_label = COALESCE($5, cta_primary_label),
         cta_primary_href = COALESCE($6, cta_primary_href),
         cta_secondary_label = COALESCE($7, cta_secondary_label),
         cta_secondary_href = COALESCE($8, cta_secondary_href),
         side_label = COALESCE($9, side_label),
         scroll_label = COALESCE($10, scroll_label),
         status = COALESCE($11, status)
       WHERE id = 1
       RETURNING background_url, tagline, title, subtitle, cta_primary_label, cta_primary_href,
                 cta_secondary_label, cta_secondary_href, side_label, scroll_label, status`,
      [
        1,
        body.tagline,
        body.title,
        body.subtitle,
        body.cta_primary_label,
        body.cta_primary_href,
        body.cta_secondary_label,
        body.cta_secondary_href,
        body.side_label,
        body.scroll_label,
        body.status,
      ]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "Hero section not found" }, { status: 404 });
    }

    const urls = await loadHeroBackgroundUrls();
    return NextResponse.json({
      ...rows[0],
      background_urls: resolveHeroBackgroundUrls(rows[0].background_url, urls),
    });
  } catch (err) {
    return adminError(err);
  }
}
