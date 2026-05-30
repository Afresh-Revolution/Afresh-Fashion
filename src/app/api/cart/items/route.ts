import { NextResponse } from "next/server";
import { addProductToCart } from "@/lib/cart";
import { getOrCreateSession } from "@/lib/cart";
import { apiErrorResponse } from "@/lib/safe-api-error";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const productId = String(body.product_id || "");
    const quantity = Math.max(1, Number(body.quantity) || 1);
    if (!productId) {
      return NextResponse.json({ error: "product_id required" }, { status: 400 });
    }

    const token = await getOrCreateSession();
    const cart = await addProductToCart(token, productId, quantity);
    return NextResponse.json(cart);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Product not available" || msg === "Not enough stock") {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return apiErrorResponse(err, "Could not add to bag", 400);
  }
}
