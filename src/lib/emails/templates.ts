import { ctaButton, emailLayout } from "@/lib/emails/layout";

function esc(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function vipWelcomeEmail(opts: { siteUrl?: string }) {
  const shopUrl = `${opts.siteUrl || ""}/#shop`;
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:400;color:#F5F5F5;text-align:center;">
      Welcome to the Inner Circle
    </h1>
    <p style="color:#BFC0C0;text-align:center;margin:0 0 24px;">
      You&apos;re in. Membership has its privileges — early access, private collections, VIP events, and a seat at the table of culture.
    </p>
    <ul style="color:#BFC0C0;padding-left:20px;margin:0 0 24px;">
      <li>24hr early access on drops</li>
      <li>Invite-only private collections</li>
      <li>VIP events &amp; private views</li>
      <li>Member-only gifts</li>
    </ul>
    ${ctaButton("Explore the shop", shopUrl)}
    <p style="font-size:12px;color:#888;text-align:center;margin-top:24px;">
      Free to join · No spam · Unsubscribe anytime
    </p>
  `;
  return {
    subject: "Welcome to AFRESH Inner Circle ✦",
    html: emailLayout(body),
  };
}

export function adminVipSignupEmail(opts: { memberEmail: string; siteUrl?: string }) {
  const adminUrl = `${opts.siteUrl || ""}/admin`;
  const body = `
    <h1 style="margin:0 0 12px;font-size:18px;color:#C8A96B;">New VIP signup</h1>
    <p style="color:#BFC0C0;margin:0 0 8px;"><strong style="color:#F5F5F5;">${opts.memberEmail}</strong> joined the Inner Circle on your landing page.</p>
    <p style="color:#888;font-size:13px;margin:0 0 20px;">A welcome email was sent automatically via Resend.</p>
    ${ctaButton("Open admin panel", adminUrl)}
  `;
  return {
    subject: `VIP signup: ${opts.memberEmail}`,
    html: emailLayout(body),
  };
}

export interface SubscriptionEmailContent {
  headline: string;
  intro: string;
  priceLine?: string;
  description?: string;
  perks?: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
}

export function vipSubscriptionEmail(content: SubscriptionEmailContent) {
  const perksHtml = content.perks
    ? `<div style="margin:20px 0;padding:16px 20px;background:rgba(200,169,107,0.08);border-left:3px solid #C8A96B;">
        <p style="margin:0;color:#BFC0C0;white-space:pre-line;">${esc(content.perks)}</p>
      </div>`
    : "";

  const priceHtml = content.priceLine
    ? `<p style="margin:16px 0;font-size:20px;color:#C8A96B;text-align:center;letter-spacing:0.05em;">${esc(content.priceLine)}</p>`
    : "";

  const descHtml = content.description
    ? `<p style="color:#BFC0C0;margin:0 0 16px;">${esc(content.description)}</p>`
    : "";

  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:400;color:#F5F5F5;text-align:center;">
      ${esc(content.headline)}
    </h1>
    <p style="color:#BFC0C0;margin:0 0 16px;">${esc(content.intro)}</p>
    ${priceHtml}
    ${descHtml}
    ${perksHtml}
    ${ctaButton(esc(content.ctaLabel), content.ctaUrl)}
    ${
      content.footerNote
        ? `<p style="font-size:12px;color:#888;text-align:center;margin-top:20px;">${esc(content.footerNote)}</p>`
        : ""
    }
  `;

  return { html: emailLayout(body) };
}
