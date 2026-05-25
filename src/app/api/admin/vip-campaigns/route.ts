import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";
import { getSiteUrl } from "@/lib/resend";
import { sendSubscriptionCampaign } from "@/lib/vip";

export async function GET() {
  try {
    await requireAdmin();
    const { rows } = await query(
      `SELECT id, subject, headline, intro, price_line, description, perks,
              cta_label, cta_url, footer_note, status, recipient_count, sent_at, created_at
       FROM vip_email_campaigns ORDER BY created_at DESC LIMIT 20`
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

    if (body.action === "send") {
      const siteUrl = getSiteUrl(request);
      const ctaUrl = String(body.cta_url || "/#shop");
      const fullCta = ctaUrl.startsWith("http") ? ctaUrl : `${siteUrl}${ctaUrl.startsWith("/") ? "" : "/"}${ctaUrl}`;

      let campaignId = body.campaign_id as string | undefined;

      if (!campaignId) {
        const inserted = await query<{ id: string }>(
          `INSERT INTO vip_email_campaigns (subject, headline, intro, price_line, description, perks, cta_label, cta_url, footer_note)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [
            body.subject,
            body.headline,
            body.intro,
            body.price_line ?? null,
            body.description ?? null,
            body.perks ?? null,
            body.cta_label ?? "Explore the collection",
            fullCta,
            body.footer_note ?? null,
          ]
        );
        campaignId = inserted.rows[0].id;
      }

      const result = await sendSubscriptionCampaign(campaignId!, {
        subject: body.subject,
        headline: body.headline,
        intro: body.intro,
        priceLine: body.price_line,
        description: body.description,
        perks: body.perks,
        ctaLabel: body.cta_label ?? "Explore the collection",
        ctaUrl: fullCta,
        footerNote: body.footer_note,
      });

      return NextResponse.json({ ok: true, ...result, campaignId });
    }

    const { rows } = await query(
      `INSERT INTO vip_email_campaigns (subject, headline, intro, price_line, description, perks, cta_label, cta_url, footer_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        body.subject ?? "AFRESH VIP — Exclusive access",
        body.headline ?? "Your private collection awaits",
        body.intro ?? "",
        body.price_line ?? null,
        body.description ?? null,
        body.perks ?? null,
        body.cta_label ?? "Explore the collection",
        body.cta_url ?? "/#shop",
        body.footer_note ?? null,
      ]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    return adminError(err);
  }
}
