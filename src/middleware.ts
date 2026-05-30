import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-edge";
import { rateLimitForPath } from "@/lib/api-rate-limits";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];

function apiRateLimit(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/")) return null;

  const config = rateLimitForPath(pathname);
  if (!config) return null;

  const ip = getClientIp(request);
  const result = checkRateLimit(`${pathname}:${ip}`, config);
  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(result.retryAfterSec) },
      }
    );
  }
  return null;
}

async function requireAdminApi(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/admin/")) return null;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const limited = apiRateLimit(request);
  if (limited) return limited;

  const adminApiDenied = await requireAdminApi(request);
  if (adminApiDenied) return adminApiDenied;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token && (pathname === "/admin/login" || pathname === "/admin/forgot-password")) {
      const session = await verifySessionToken(token);
      if (session) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const session = await verifySessionToken(token);
  if (!session) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", pathname);
    const res = NextResponse.redirect(login);
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
