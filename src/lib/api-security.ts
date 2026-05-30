import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getCartSessionToken } from "@/lib/cart-session";
import { checkRateLimit, getClientIp, type RateLimitConfig } from "@/lib/rate-limit";
import { query } from "@/lib/db";

export function hashResetTokenLookup(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function rateLimitResponse(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}

export function enforceRateLimit(request: Request, bucket: string, config: RateLimitConfig) {
  const ip = getClientIp(request);
  const result = checkRateLimit(`${bucket}:${ip}`, config);
  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterSec);
  }
  return null;
}

export async function readJsonBody<T = Record<string, unknown>>(
  request: Request,
  maxBytes = 32_768
): Promise<T> {
  const raw = await request.text();
  if (raw.length > maxBytes) {
    throw new Error("Request body too large");
  }
  if (!raw.trim()) return {} as T;
  return JSON.parse(raw) as T;
}

export async function orderBelongsToSession(orderId: string, sessionToken: string | null) {
  if (!sessionToken) return false;
  const { rows } = await query<{ id: string }>(
    `SELECT o.id
     FROM orders o
     JOIN carts c ON c.id = o.cart_id
     WHERE o.id = $1 AND c.session_token = $2
     LIMIT 1`,
    [orderId, sessionToken]
  );
  return Boolean(rows[0]);
}

export async function requireOrderSession(orderId: string) {
  const sessionToken = await getCartSessionToken();
  const ok = await orderBelongsToSession(orderId, sessionToken);
  if (!ok) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return null;
}

/** Server-side shipping — client cannot set arbitrary amounts. */
export function computeShippingAmount(subtotalNgn: number): number {
  const flat = Number(process.env.SHIPPING_FLAT_NGN ?? "0");
  const freeOver = Number(process.env.SHIPPING_FREE_OVER_NGN ?? "150000");
  if (subtotalNgn >= freeOver) return 0;
  return Math.max(0, flat);
}
