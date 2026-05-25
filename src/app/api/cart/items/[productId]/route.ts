import { NextResponse } from "next/server";
import { removeCartItem, updateCartItemQuantity } from "@/lib/cart";
import { getCartSessionToken } from "@/lib/cart-session";

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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 400 }
    );
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Remove failed" },
      { status: 400 }
    );
  }
}
