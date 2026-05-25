import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { rows } = await query(
      `UPDATE editorial_articles SET
         layout = COALESCE($2, layout),
         tag = COALESCE($3, tag),
         title = COALESCE($4, title),
         excerpt = COALESCE($5, excerpt),
         meta_text = COALESCE($6, meta_text),
         image_url = COALESCE($7, image_url),
         sort_order = COALESCE($8, sort_order),
         status = COALESCE($9, status)
       WHERE id = $1
       RETURNING id, layout, tag, title, excerpt, meta_text, image_url, sort_order, status`,
      [
        id,
        body.layout,
        body.tag,
        body.title,
        body.excerpt,
        body.meta_text,
        body.image_url,
        body.sort_order,
        body.status,
      ]
    );
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    return adminError(err);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    await query(`DELETE FROM editorial_articles WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminError(err);
  }
}
