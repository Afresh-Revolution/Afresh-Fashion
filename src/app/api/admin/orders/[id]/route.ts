import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";
import { confirmManualOrder, getOrderById } from "@/lib/orders";
import { sendOrderConfirmedToCustomer } from "@/lib/order-notifications";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (err) {
    return adminError(err);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    if (body.action === "confirm_manual") {
      const expected = String(body.expected_delivery_at || "").trim();
      const message = String(body.delivery_message || "").trim();
      if (!expected || !message) {
        return NextResponse.json(
          { error: "Expected delivery date and delivery message are required" },
          { status: 400 }
        );
      }

      await confirmManualOrder(id, {
        expected_delivery_at: expected,
        delivery_message: message,
      });

      const order = await getOrderById(id);
      if (order) {
        await sendOrderConfirmedToCustomer(order, {
          expected_delivery_at: expected,
          delivery_message: message,
        });
      }

      return NextResponse.json({ ok: true, order });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return adminError(err);
  }
}
