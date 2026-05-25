import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getOrderById } from "@/lib/orders";
import { buildPaystackReference, paystackInitialize } from "@/lib/paystack";
import { isPaystackConfigured } from "@/lib/payment-config";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    if (!isPaystackConfigured()) {
      return NextResponse.json({ error: "Paystack is not configured" }, { status: 503 });
    }

    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const reference = buildPaystackReference(order.order_number);

    await query(
      `UPDATE orders SET payment_method = 'paystack', paystack_reference = $2 WHERE id = $1`,
      [id, reference]
    );

    const init = await paystackInitialize({
      email: order.email,
      amountNgn: order.total_amount,
      reference,
      metadata: { order_id: order.id, order_number: order.order_number },
    });

    return NextResponse.json({
      authorization_url: init.authorization_url,
      reference: init.reference,
    });
  } catch (err) {
    console.error("paystack init:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start payment" },
      { status: 500 }
    );
  }
}
