import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api-security";
import { query } from "@/lib/db";
import { getOrderById, markOrderPaidPaystack } from "@/lib/orders";
import { notifyPaystackPaid } from "@/lib/order-notifications";
import { paystackVerify } from "@/lib/paystack";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{ reference?: string }>(request, 4096);
    const reference = String(body.reference || "").trim();
    if (!reference) {
      return NextResponse.json({ error: "reference required" }, { status: 400 });
    }

    const verified = await paystackVerify(reference);
    if (verified?.status !== "success") {
      return NextResponse.json({ error: "Payment was not successful" }, { status: 400 });
    }

    const found = await query<{ id: string }>(
      `SELECT id FROM orders WHERE paystack_reference = $1 LIMIT 1`,
      [reference]
    );
    if (!found.rows[0]) {
      return NextResponse.json({ error: "Order not found for this payment" }, { status: 404 });
    }

    await markOrderPaidPaystack(found.rows[0].id, reference);
    const order = await getOrderById(found.rows[0].id);
    if (order) await notifyPaystackPaid(order, request);

    return NextResponse.json({ ok: true, order });
  } catch (err) {
    console.error("paystack verify:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 500 }
    );
  }
}
