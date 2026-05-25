import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

export async function GET() {
  try {
    await requireAdmin();
    const { rows } = await query(
      `SELECT id, layout, tag, title, excerpt, meta_text, image_url, sort_order, status
       FROM editorial_articles ORDER BY sort_order ASC`
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
      `INSERT INTO editorial_articles (layout, tag, title, excerpt, meta_text, image_url, sort_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, layout, tag, title, excerpt, meta_text, image_url, sort_order, status`,
      [
        body.layout ?? "card",
        body.tag ?? "",
        body.title,
        body.excerpt ?? null,
        body.meta_text ?? null,
        body.image_url ?? null,
        body.sort_order ?? 0,
        body.status ?? "draft",
      ]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    return adminError(err);
  }
}
