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
    const isSymbolic = body.is_symbolic !== undefined ? Boolean(body.is_symbolic) : undefined;

    const { rows } = await query(
      `UPDATE about_stats SET
         value_numeric = CASE WHEN COALESCE($2, is_symbolic) = TRUE THEN NULL ELSE COALESCE($3, value_numeric) END,
         is_symbolic = COALESCE($2, is_symbolic),
         symbol_text = CASE WHEN COALESCE($2, is_symbolic) = TRUE THEN COALESCE($4, symbol_text) ELSE NULL END,
         label = COALESCE($5, label),
         sort_order = COALESCE($6, sort_order),
         status = COALESCE($7, status)
       WHERE id = $1
       RETURNING id, value_numeric, is_symbolic, symbol_text, label, sort_order, status`,
      [
        id,
        isSymbolic,
        body.value_numeric,
        body.symbol_text,
        body.label,
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
    await query(`DELETE FROM about_stats WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminError(err);
  }
}
