import { jwtVerify } from "jose";

export const SESSION_COOKIE = "afresh_admin_session";

export interface AdminSession {
  sub: string;
  email: string;
  role: string;
  name: string | null;
}

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  const secret = getSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || !payload.email) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      role: String(payload.role ?? "editor"),
      name: payload.name ? String(payload.name) : null,
    };
  } catch {
    return null;
  }
}
