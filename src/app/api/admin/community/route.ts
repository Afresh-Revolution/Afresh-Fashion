import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

export async function GET() {
  try {
    await requireAdmin();
    const { rows } = await query(
      `SELECT id, handle, image_url, is_featured, is_large_tile, sort_order, status
       FROM community_posts ORDER BY sort_order ASC`
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
    const { rows } = await query(
      `INSERT INTO community_posts (handle, image_url, is_featured, is_large_tile, sort_order, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, handle, image_url, is_featured, is_large_tile, sort_order, status`,
      [
        body.handle,
        body.image_url ?? null,
        body.is_featured ?? false,
        body.is_large_tile ?? false,
        body.sort_order ?? 0,
        body.status ?? "draft",
      ]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    return adminError(err);
  }
}
