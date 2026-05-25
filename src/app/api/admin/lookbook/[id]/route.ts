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
      `UPDATE lookbook_looks SET
         label = COALESCE($2, label),
         image_url = COALESCE($3, image_url),
         sort_order = COALESCE($4, sort_order),
         status = COALESCE($5, status)
       WHERE id = $1
       RETURNING id, label, image_url, sort_order, status`,
      [id, body.label, body.image_url, body.sort_order, body.status]
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
    await query(`DELETE FROM lookbook_looks WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminError(err);
  }
}
