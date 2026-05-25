import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const unreadOnly = new URL(request.url).searchParams.get("unread") === "1";

    const { rows } = await query<{
      id: string;
      type: string;
      title: string;
      message: string;
      metadata: Record<string, unknown>;
      read_at: string | null;
      created_at: string;
    }>(
      unreadOnly
        ? `SELECT id, type, title, message, metadata, read_at, created_at
           FROM admin_notifications WHERE read_at IS NULL
           ORDER BY created_at DESC LIMIT 50`
        : `SELECT id, type, title, message, metadata, read_at, created_at
           FROM admin_notifications ORDER BY created_at DESC LIMIT 100`
    );

    const count = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM admin_notifications WHERE read_at IS NULL`
    );

    return NextResponse.json({
      notifications: rows,
      unreadCount: Number(count.rows[0]?.count ?? 0),
    });
  } catch (err) {
    return adminError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (body.markAllRead) {
      await query(`UPDATE admin_notifications SET read_at = NOW() WHERE read_at IS NULL`);
      return NextResponse.json({ ok: true });
    }

    if (body.id) {
      await query(`UPDATE admin_notifications SET read_at = NOW() WHERE id = $1`, [body.id]);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (err) {
    return adminError(err);
  }
}
