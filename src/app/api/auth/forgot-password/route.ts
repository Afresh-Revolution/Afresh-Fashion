import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { hashResetTokenLookup, readJsonBody } from "@/lib/api-security";
import { findAdminByEmail } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{ email?: string }>(request, 4096);
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const admin = await findAdminByEmail(email);
    const message =
      "If an account exists for that email, password reset instructions have been sent.";

    if (!admin || !admin.is_active) {
      return NextResponse.json({ ok: true, message });
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashResetTokenLookup(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await query(
      `INSERT INTO password_reset_tokens (admin_user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [admin.id, tokenHash, expiresAt.toISOString()]
    );

    const payload: { ok: boolean; message: string; resetUrl?: string } = { ok: true, message };

    if (process.env.NODE_ENV === "development") {
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      payload.resetUrl = `${base}/admin/reset-password?token=${rawToken}`;
    }

    return NextResponse.json(payload);
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Unable to process request" }, { status: 500 });
  }
}
