import { NextResponse } from "next/server";
import { getCartForSession } from "@/lib/cart";
import { getCartSessionToken } from "@/lib/cart-session";

export async function GET() {
  try {
    const token = await getCartSessionToken();
    if (!token) {
      return NextResponse.json({
        id: null,
        item_count: 0,
        subtotal_amount: 0,
        currency_code: "NGN",
        items: [],
      });
    }
    const cart = await getCartForSession(token);
    return NextResponse.json(
      cart ?? {
        id: null,
        item_count: 0,
        subtotal_amount: 0,
        currency_code: "NGN",
        items: [],
      }
    );
  } catch (err) {
    console.error("cart GET:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load bag" },
      { status: 500 }
    );
  }
}
