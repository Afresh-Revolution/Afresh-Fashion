import { NextResponse } from "next/server";
import { getCartForSession } from "@/lib/cart";
import { getCartSessionToken } from "@/lib/cart-session";
import { apiErrorResponse } from "@/lib/safe-api-error";

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
    return apiErrorResponse(err, "Could not load bag", 500);
  }
}
