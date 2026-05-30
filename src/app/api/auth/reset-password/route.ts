import { NextResponse } from "next/server";
import { hashResetTokenLookup, readJsonBody } from "@/lib/api-security";
import { hashPassword } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{ token?: string; password?: string }>(request, 4096);
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token || !password) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const tokenHash = hashResetTokenLookup(token);

    const { rows } = await query<{
      id: string;
      admin_user_id: string;
    }>(
      `SELECT id, admin_user_id
       FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    const match = rows[0];
    if (!match) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    await query(`UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [
      passwordHash,
      match.admin_user_id,
    ]);

    await query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [match.id]);

    return NextResponse.json({ ok: true, message: "Password updated. You can sign in now." });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Unable to reset password" }, { status: 500 });
  }
}
