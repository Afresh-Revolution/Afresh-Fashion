import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";
import { resolveMediaUrl } from "@/lib/b2";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { rows } = await query(
      `UPDATE cinematic_videos SET
         title = COALESCE($2, title),
         video_url = COALESCE($3, video_url),
         poster_url = COALESCE($4, poster_url),
         file_size_bytes = COALESCE($5, file_size_bytes),
         mime_type = COALESCE($6, mime_type),
         sort_order = COALESCE($7, sort_order),
         status = COALESCE($8, status)
       WHERE id = $1
       RETURNING id, title, video_url, poster_url, sort_order, status`,
      [
        id,
        body.title,
        body.video_url,
        body.poster_url,
        body.file_size_bytes,
        body.mime_type,
        body.sort_order,
        body.status,
      ]
    );
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const row = rows[0];
    return NextResponse.json({
      ...row,
      video_url: resolveMediaUrl(row.video_url),
      poster_url: resolveMediaUrl(row.poster_url),
    });
  } catch (err) {
    return adminError(err);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    await query(`DELETE FROM cinematic_videos WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminError(err);
  }
}
