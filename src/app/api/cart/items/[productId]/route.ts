import { NextResponse } from "next/server";
import { removeCartItem, updateCartItemQuantity } from "@/lib/cart";
import { getCartSessionToken } from "@/lib/cart-session";
import { apiErrorResponse } from "@/lib/safe-api-error";

const CART_CLIENT_ERRORS = new Set([
  "Cart not found",
  "Not enough stock",
  "Product not available",
]);

type Params = { params: Promise<{ productId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { productId } = await params;
    const token = await getCartSessionToken();
    if (!token) return NextResponse.json({ error: "No cart" }, { status: 400 });

    const body = await request.json();
    const quantity = Number(body.quantity);
    if (!Number.isFinite(quantity)) {
      return NextResponse.json({ error: "quantity required" }, { status: 400 });
    }

    const cart = await updateCartItemQuantity(token, productId, quantity);
    return NextResponse.json(cart);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (CART_CLIENT_ERRORS.has(msg)) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return apiErrorResponse(err, "Update failed", 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { productId } = await params;
    const token = await getCartSessionToken();
    if (!token) return NextResponse.json({ error: "No cart" }, { status: 400 });
    const cart = await removeCartItem(token, productId);
    return NextResponse.json(cart);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (CART_CLIENT_ERRORS.has(msg)) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return apiErrorResponse(err, "Remove failed", 400);
  }
}
