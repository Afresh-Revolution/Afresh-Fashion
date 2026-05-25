import { NextResponse } from "next/server";
import { getOrCreateSession } from "@/lib/cart";
import { createOrderFromCart } from "@/lib/orders";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const required = [
      ["full_name", "Full name"],
      ["phone", "Phone"],
      ["address_line1", "Street address"],
      ["city", "City"],
      ["state", "State"],
      ["country", "Country"],
    ] as const;

    for (const [key, label] of required) {
      if (!String(body[key] || "").trim()) {
        return NextResponse.json({ error: `${label} is required` }, { status: 400 });
      }
    }

    const token = await getOrCreateSession();
    const order = await createOrderFromCart({
      sessionToken: token,
      email,
      full_name: body.full_name,
      phone: body.phone,
      address_line1: body.address_line1,
      address_line2: body.address_line2,
      city: body.city,
      state: body.state,
      country: body.country,
      postal_code: body.postal_code,
      customer_notes: body.customer_notes,
      shipping_amount: Number(body.shipping_amount) || 0,
    });

    return NextResponse.json({ order });
  } catch (err) {
    console.error("order create:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create order" },
      { status: 400 }
    );
  }
}
