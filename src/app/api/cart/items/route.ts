import { NextResponse } from "next/server";
import { addProductToCart } from "@/lib/cart";
import { getOrCreateSession } from "@/lib/cart";

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
    console.error("cart add:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not add to bag" },
      { status: 400 }
    );
  }
}
