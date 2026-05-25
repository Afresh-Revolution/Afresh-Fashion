import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";
import { registerVipMember } from "@/lib/vip";

export async function GET() {
  try {
    await requireAdmin();
    const { rows } = await query<{
      id: string;
      email: string;
      source: string;
      is_active: boolean;
      joined_at: string;
    }>(
      `SELECT id, email, source, is_active, joined_at
       FROM vip_members
       ORDER BY joined_at DESC`
    );
    return NextResponse.json(rows);
  } catch (err) {
    return adminError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const result = await registerVipMember(email, "admin");
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return adminError(err);
  }
}
