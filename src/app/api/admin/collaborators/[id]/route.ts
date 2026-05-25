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
      `UPDATE collaborators SET
         name = COALESCE($2, name),
         role = COALESCE($3, role),
         avatar_url = COALESCE($4, avatar_url),
         is_wide_tile = COALESCE($5, is_wide_tile),
         sort_order = COALESCE($6, sort_order),
         status = COALESCE($7, status)
       WHERE id = $1
       RETURNING id, name, role, avatar_url, is_wide_tile, sort_order, status`,
      [id, body.name, body.role, body.avatar_url, body.is_wide_tile, body.sort_order, body.status]
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
    await query(`DELETE FROM collaborators WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminError(err);
  }
}
