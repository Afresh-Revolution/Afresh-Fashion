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
      `UPDATE community_posts SET
         handle = COALESCE($2, handle),
         image_url = COALESCE($3, image_url),
         is_featured = COALESCE($4, is_featured),
         is_large_tile = COALESCE($5, is_large_tile),
         sort_order = COALESCE($6, sort_order),
         status = COALESCE($7, status)
       WHERE id = $1
       RETURNING id, handle, image_url, is_featured, is_large_tile, sort_order, status`,
      [
        id,
        body.handle,
        body.image_url,
        body.is_featured,
        body.is_large_tile,
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
    await query(`DELETE FROM community_posts WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminError(err);
  }
}
