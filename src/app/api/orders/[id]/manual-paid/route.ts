import { NextResponse } from "next/server";
import { getOrderById, markManualPaymentPending } from "@/lib/orders";
import { notifyManualPaymentSubmitted } from "@/lib/order-notifications";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await markManualPaymentPending(id);
    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    await notifyManualPaymentSubmitted(order, request);

    return NextResponse.json({
      ok: true,
      message:
        "Thank you. We received your payment notice and will confirm shortly. Check your email for updates.",
      order,
    });
  } catch (err) {
    console.error("manual-paid:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not submit payment" },
      { status: 500 }
    );
  }
}
