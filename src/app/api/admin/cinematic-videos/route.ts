import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

export async function GET() {
  try {
    await requireAdmin();
    const { rows } = await query(
      `SELECT id, title, video_url, poster_url, sort_order, status, file_size_bytes
       FROM cinematic_videos ORDER BY sort_order ASC`
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
    if (!body.video_url) {
      return NextResponse.json({ error: "video_url is required" }, { status: 400 });
    }
    const { rows } = await query(
      `INSERT INTO cinematic_videos (title, video_url, poster_url, file_size_bytes, mime_type, sort_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, video_url, poster_url, sort_order, status`,
      [
        body.title ?? null,
        body.video_url,
        body.poster_url ?? null,
        body.file_size_bytes ?? null,
        body.mime_type ?? null,
        body.sort_order ?? 0,
        body.status ?? "draft",
      ]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    return adminError(err);
  }
}
