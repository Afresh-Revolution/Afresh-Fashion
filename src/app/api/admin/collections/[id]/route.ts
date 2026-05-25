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
      `UPDATE collections SET
         chapter = COALESCE($2, chapter),
         title = COALESCE($3, title),
         description = COALESCE($4, description),
         image_url = COALESCE($5, image_url),
         slug = COALESCE($6, slug),
         sort_order = COALESCE($7, sort_order),
         status = COALESCE($8, status)
       WHERE id = $1
       RETURNING id, chapter, title, description, image_url, slug, sort_order, status`,
      [
        id,
        body.chapter,
        body.title,
        body.description,
        body.image_url,
        body.slug,
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
    await query(`DELETE FROM collections WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminError(err);
  }
}
