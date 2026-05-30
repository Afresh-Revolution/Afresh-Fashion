import { NextResponse } from "next/server";
import { requireOrderSession } from "@/lib/api-security";
import { apiErrorResponse } from "@/lib/safe-api-error";
import { getOrderById, markManualPaymentPending } from "@/lib/orders";
import { notifyManualPaymentSubmitted } from "@/lib/order-notifications";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const denied = await requireOrderSession(id);
    if (denied) return denied;

    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.payment_status === "paid") {
      return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
    }

    await markManualPaymentPending(id);
    await notifyManualPaymentSubmitted(order, request);

    return NextResponse.json({
      ok: true,
      message:
        "Thank you. We received your payment notice and will confirm shortly. Check your email for updates.",
      order,
    });
  } catch (err) {
    return apiErrorResponse(err, "Could not submit payment", 500);
  }
}
