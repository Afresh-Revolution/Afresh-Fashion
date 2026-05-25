import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

const DROP_SELECT = `SELECT id, section_label, heading, title, subtitle, pieces_worldwide, drop_at::text,
       background_url, cta_primary_label, cta_secondary_label, footnote, status, is_active`;

export async function GET() {
  try {
    await requireAdmin();
    const { rows } = await query(
      `${DROP_SELECT} FROM drops WHERE is_active = TRUE ORDER BY updated_at DESC LIMIT 1`
    );
    return NextResponse.json(rows[0] ?? null);
  } catch (err) {
    return adminError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    const existing = await query<{ id: string }>(
      `SELECT id FROM drops WHERE is_active = TRUE ORDER BY updated_at DESC LIMIT 1`
    );

    if (existing.rows[0]) {
      const id = existing.rows[0].id;
      const { rows } = await query(
        `UPDATE drops SET
           section_label = COALESCE($2, section_label),
           heading = COALESCE($3, heading),
           title = COALESCE($4, title),
           subtitle = COALESCE($5, subtitle),
           pieces_worldwide = COALESCE($6, pieces_worldwide),
           drop_at = COALESCE($7::timestamptz, drop_at),
           background_url = COALESCE($8, background_url),
           cta_primary_label = COALESCE($9, cta_primary_label),
           cta_secondary_label = COALESCE($10, cta_secondary_label),
           footnote = COALESCE($11, footnote),
           status = COALESCE($12, status)
         WHERE id = $1
         RETURNING id, section_label, heading, title, subtitle, pieces_worldwide, drop_at::text,
                   background_url, cta_primary_label, cta_secondary_label, footnote, status, is_active`,
        [
          id,
          body.section_label,
          body.heading,
          body.title,
          body.subtitle,
          body.pieces_worldwide,
          body.drop_at,
          body.background_url,
          body.cta_primary_label,
          body.cta_secondary_label,
          body.footnote,
          body.status,
        ]
      );
      return NextResponse.json(rows[0]);
    }

    const dropAt = body.drop_at ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { rows } = await query(
      `INSERT INTO drops (
         is_active, section_label, heading, title, subtitle, pieces_worldwide, drop_at,
         background_url, cta_primary_label, cta_secondary_label, footnote, status
       ) VALUES (TRUE, $1, $2, $3, $4, $5, $6::timestamptz, $7, $8, $9, $10, $11)
       RETURNING id, section_label, heading, title, subtitle, pieces_worldwide, drop_at::text,
                 background_url, cta_primary_label, cta_secondary_label, footnote, status, is_active`,
      [
        body.section_label ?? "Limited Edition",
        body.heading ?? "NEXT DROP",
        body.title ?? "Ancestral Code",
        body.subtitle ?? 'The "Ancestral Code" Capsule — 50 Pieces Worldwide',
        body.pieces_worldwide ?? 50,
        dropAt,
        body.background_url ?? null,
        body.cta_primary_label ?? "Get Early Access",
        body.cta_secondary_label ?? "Unlock Private Collection",
        body.footnote ?? "Invite-only • VIP members get 24hr early access",
        body.status ?? "published",
      ]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    return adminError(err);
  }
}
