import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export const CART_COOKIE = "afresh_cart_session";

export async function getCartSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(CART_COOKIE)?.value ?? null;
}

export async function setCartSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(CART_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function newCartSessionToken() {
  return randomBytes(24).toString("hex");
}
