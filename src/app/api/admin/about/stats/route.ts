import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const isSymbolic = Boolean(body.is_symbolic);
    const { rows } = await query(
      `INSERT INTO about_stats (value_numeric, is_symbolic, symbol_text, label, sort_order, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, value_numeric, is_symbolic, symbol_text, label, sort_order, status`,
      [
        isSymbolic ? null : (body.value_numeric ?? 0),
        isSymbolic,
        isSymbolic ? (body.symbol_text ?? "∞") : null,
        body.label ?? "New stat",
        body.sort_order ?? 0,
        body.status ?? "draft",
      ]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    return adminError(err);
  }
}
