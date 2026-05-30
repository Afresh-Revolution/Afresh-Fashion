import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api-security";
import { apiErrorResponse } from "@/lib/safe-api-error";
import { getOrCreateSession } from "@/lib/cart";
import { createOrderFromCart } from "@/lib/orders";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<Record<string, unknown>>(request);
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
      full_name: String(body.full_name).trim(),
      phone: String(body.phone).trim(),
      address_line1: String(body.address_line1).trim(),
      address_line2: String(body.address_line2 || "").trim(),
      city: String(body.city).trim(),
      state: String(body.state).trim(),
      country: String(body.country).trim(),
      postal_code: String(body.postal_code || "").trim(),
      customer_notes: String(body.customer_notes || "").trim() || undefined,
    });

    return NextResponse.json({ order });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Your bag is empty" || msg === "Invalid order total") {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return apiErrorResponse(err, "Could not create order", 400);
  }
}
