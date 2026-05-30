import type { RateLimitConfig } from "@/lib/rate-limit";

/** Per-IP limits used by middleware and route handlers. */
export function rateLimitForPath(pathname: string): RateLimitConfig | null {
  if (pathname.startsWith("/api/auth/login")) {
    return { limit: 10, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/auth/forgot-password") || pathname.startsWith("/api/auth/reset-password")) {
    return { limit: 6, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/vip/join")) {
    return { limit: 5, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/orders/create")) {
    return { limit: 8, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/orders/") && pathname.includes("/paystack")) {
    return { limit: 12, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/orders/") && pathname.endsWith("/manual-paid")) {
    return { limit: 6, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/orders/paystack/verify")) {
    return { limit: 15, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/search")) {
    return { limit: 40, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/content")) {
    return { limit: 120, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/cart")) {
    return { limit: 60, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/admin/upload")) {
    return { limit: 20, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/admin/")) {
    return { limit: 180, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/")) {
    return { limit: 100, windowMs: 60_000 };
  }
  return null;
}
