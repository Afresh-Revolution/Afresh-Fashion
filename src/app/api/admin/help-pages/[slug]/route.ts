import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

type Params = { params: Promise<{ slug: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { slug } = await params;
    const body = await request.json();

    const { rows } = await query(
      `UPDATE help_pages SET
         title = COALESCE($2, title),
         body = COALESCE($3, body),
         diagram_url = COALESCE($4, diagram_url),
         diagram_caption = COALESCE($5, diagram_caption),
         contact_email = COALESCE($6, contact_email),
         status = COALESCE($7, status)
       WHERE slug = $1
       RETURNING slug, title, body, diagram_url, diagram_caption, contact_email, sort_order, status`,
      [
        slug,
        body.title,
        body.body,
        body.diagram_url,
        body.diagram_caption,
        body.contact_email,
        body.status,
      ]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "Help page not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    return adminError(err);
  }
}
