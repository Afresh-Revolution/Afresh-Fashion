import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

export async function GET() {
  try {
    await requireAdmin();
    const { rows } = await query(
      `SELECT id, chapter, title, description, image_url, slug, sort_order, status
       FROM collections ORDER BY sort_order ASC`
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
      `INSERT INTO collections (chapter, title, description, image_url, slug, sort_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, chapter, title, description, image_url, slug, sort_order, status`,
      [
        body.chapter ?? "Chapter",
        body.title,
        body.description ?? "",
        body.image_url ?? null,
        body.slug ?? null,
        body.sort_order ?? 0,
        body.status ?? "draft",
      ]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    return adminError(err);
  }
}
