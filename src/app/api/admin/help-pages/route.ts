import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

export async function GET() {
  try {
    await requireAdmin();
    const { rows } = await query(
      `SELECT slug, title, body, diagram_url, diagram_caption, contact_email, sort_order, status
       FROM help_pages ORDER BY sort_order ASC`
    );
    return NextResponse.json(rows);
  } catch (err) {
    return adminError(err);
  }
}
