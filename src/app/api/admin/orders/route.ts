import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("payment_status");

    const { rows } = await query(
      `SELECT id, order_number, email, full_name, phone, status, payment_method, payment_status,
              total_amount, placed_at, manual_paid_at, paid_at, expected_delivery_at
       FROM orders
       WHERE ($1::text IS NULL OR payment_status = $1)
       ORDER BY placed_at DESC
       LIMIT 100`,
      [filter]
    );

    return NextResponse.json(
      rows.map((r) => ({
        ...r,
        total_amount: Number(r.total_amount),
      }))
    );
  } catch (err) {
    return adminError(err);
  }
}
