import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api-security";
import {
  createSessionToken,
  findAdminByEmail,
  setSessionCookie,
  updateLastLogin,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{ email?: string; password?: string }>(request, 4096);
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const admin = await findAdminByEmail(email);
    if (!admin || !admin.is_active) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(password, admin.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await updateLastLogin(admin.id);

    const token = await createSessionToken({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.full_name,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: { email: admin.email, name: admin.full_name, role: admin.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Unable to sign in" }, { status: 500 });
  }
}
