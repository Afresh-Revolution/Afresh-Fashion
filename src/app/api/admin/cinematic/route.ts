import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

export async function GET() {
  try {
    await requireAdmin();
    const { rows } = await query(
      `SELECT quote, attribution, image_url, toast_message FROM cinematic_section WHERE id = 1`
    );
    return NextResponse.json(rows[0] ?? null);
  } catch (err) {
    return adminError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { rows } = await query(
      `UPDATE cinematic_section SET
         quote = COALESCE($1, quote),
         attribution = COALESCE($2, attribution),
         image_url = COALESCE($3, image_url),
         toast_message = COALESCE($4, toast_message)
       WHERE id = 1
       RETURNING quote, attribution, image_url, toast_message`,
      [body.quote, body.attribution, body.image_url, body.toast_message]
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return adminError(err);
  }
}
