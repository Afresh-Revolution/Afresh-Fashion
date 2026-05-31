import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

export async function GET() {
  try {
    await requireAdmin();
    const [section, stats] = await Promise.all([
      query(
        `SELECT section_label, heading_line_1, heading_line_2, lead_paragraph, body_paragraph_1,
                body_paragraph_2, cta_label, cta_href, status
         FROM about_section WHERE id = 1`
      ),
      query(
        `SELECT id, value_numeric, is_symbolic, symbol_text, label, sort_order, status
         FROM about_stats ORDER BY sort_order ASC, created_at ASC`
      ),
    ]);
    return NextResponse.json({
      section: section.rows[0] ?? null,
      stats: stats.rows,
    });
  } catch (err) {
    return adminError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { rows } = await query(
      `UPDATE about_section SET
         section_label = COALESCE($1, section_label),
         heading_line_1 = COALESCE($2, heading_line_1),
         heading_line_2 = COALESCE($3, heading_line_2),
         lead_paragraph = COALESCE($4, lead_paragraph),
         body_paragraph_1 = COALESCE($5, body_paragraph_1),
         body_paragraph_2 = COALESCE($6, body_paragraph_2),
         cta_label = COALESCE($7, cta_label),
         cta_href = COALESCE($8, cta_href),
         status = COALESCE($9, status)
       WHERE id = 1
       RETURNING section_label, heading_line_1, heading_line_2, lead_paragraph, body_paragraph_1,
                 body_paragraph_2, cta_label, cta_href, status`,
      [
        body.section_label,
        body.heading_line_1,
        body.heading_line_2,
        body.lead_paragraph,
        body.body_paragraph_1,
        body.body_paragraph_2,
        body.cta_label,
        body.cta_href,
        body.status,
      ]
    );
    if (!rows[0]) {
      return NextResponse.json({ error: "About section not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    return adminError(err);
  }
}
