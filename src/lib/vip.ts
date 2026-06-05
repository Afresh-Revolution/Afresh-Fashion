import { query } from "@/lib/db";
import {
  adminVipSignupEmail,
  vipMembershipCancellationEmail,
  vipWelcomeEmail,
  vipSubscriptionEmail,
  type SubscriptionEmailContent,
} from "@/lib/emails/templates";
import { getSiteUrl, sendBatchEmails, sendEmail } from "@/lib/resend";

export async function registerVipMember(email: string, source = "landing") {
  const normalized = email.trim().toLowerCase();
  const existing = await query<{ id: string }>(
    `SELECT id FROM vip_members WHERE email = $1`,
    [normalized]
  );

  let isNew = false;
  if (!existing.rows[0]) {
    await query(
      `INSERT INTO vip_members (email, source) VALUES ($1, $2)`,
      [normalized, source]
    );
    isNew = true;
  }

  return { email: normalized, isNew };
}

export async function createAdminNotification(opts: {
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  await query(
    `INSERT INTO admin_notifications (type, title, message, metadata)
     VALUES ($1, $2, $3, $4)`,
    [opts.type, opts.title, opts.message, JSON.stringify(opts.metadata ?? {})]
  );
}

export async function notifyAdminsByEmail(opts: {
  subject: string;
  html: string;
  request?: Request;
}) {
  const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL;
  const recipients: string[] = [];

  if (notifyEmail) {
    recipients.push(notifyEmail);
  } else {
    const admins = await query<{ email: string }>(
      `SELECT email FROM admin_users WHERE is_active = TRUE`
    );
    recipients.push(...admins.rows.map((a) => a.email));
  }

  const unique = [...new Set(recipients.filter(Boolean))];
  if (unique.length === 0) return;

  await sendEmail({ to: unique, subject: opts.subject, html: opts.html });
}

export async function processVipSignup(email: string, request?: Request) {
  const siteUrl = getSiteUrl(request);
  const { email: memberEmail, isNew } = await registerVipMember(email);

  if (isNew) {
    const welcome = vipWelcomeEmail({ siteUrl });
    await sendEmail({
      to: memberEmail,
      subject: welcome.subject,
      html: welcome.html,
    });

    await createAdminNotification({
      type: "vip_signup",
      title: "New VIP member",
      message: `${memberEmail} joined the Inner Circle.`,
      metadata: { email: memberEmail },
    });

    const adminMail = adminVipSignupEmail({ memberEmail, siteUrl });
    await notifyAdminsByEmail({
      subject: adminMail.subject,
      html: adminMail.html,
      request,
    });
  }

  return { email: memberEmail, isNew };
}

export async function sendSubscriptionCampaign(
  campaignId: string,
  content: SubscriptionEmailContent & { subject: string }
) {
  const members = await query<{ email: string }>(
    `SELECT email FROM vip_members WHERE is_active = TRUE AND unsubscribed_at IS NULL`
  );

  if (members.rows.length === 0) {
    throw new Error("No active VIP members to email");
  }

  const { html } = vipSubscriptionEmail(content);
  const messages = members.rows.map((m) => ({
    to: m.email,
    subject: content.subject,
    html,
  }));

  const { sent } = await sendBatchEmails(messages);

  await query(
    `UPDATE vip_email_campaigns SET
       status = 'sent',
       recipient_count = $2,
       sent_at = NOW(),
       subject = $3,
       headline = $4,
       intro = $5,
       price_line = $6,
       description = $7,
       perks = $8,
       cta_label = $9,
       cta_url = $10,
       footer_note = $11
     WHERE id = $1`,
    [
      campaignId,
      sent,
      content.subject,
      content.headline,
      content.intro,
      content.priceLine ?? null,
      content.description ?? null,
      content.perks ?? null,
      content.ctaLabel,
      content.ctaUrl,
      content.footerNote ?? null,
    ]
  );

  await createAdminNotification({
    type: "campaign_sent",
    title: "VIP campaign sent",
    message: `Subscription email sent to ${sent} members.`,
    metadata: { campaignId, recipientCount: sent, subject: content.subject },
  });

  return { sent, total: members.rows.length };
}

export async function cancelVipMember(id: string, reason: string, request?: Request) {
  const member = await query<{
    id: string;
    email: string;
    is_active: boolean;
    unsubscribed_at: string | null;
  }>(`SELECT id, email, is_active, unsubscribed_at FROM vip_members WHERE id = $1`, [id]);

  const row = member.rows[0];
  if (!row) {
    throw new Error("VIP member not found");
  }
  if (!row.is_active || row.unsubscribed_at) {
    throw new Error("This membership is already cancelled");
  }

  await query(
    `UPDATE vip_members
     SET is_active = FALSE, unsubscribed_at = NOW()
     WHERE id = $1`,
    [id]
  );

  const siteUrl = getSiteUrl(request);
  const mail = vipMembershipCancellationEmail({ reason, siteUrl });
  await sendEmail({
    to: row.email,
    subject: mail.subject,
    html: mail.html,
  });

  await createAdminNotification({
    type: "vip_cancelled",
    title: "VIP membership cancelled",
    message: `${row.email} was removed from the Inner Circle.`,
    metadata: { email: row.email, reason },
  });

  return { email: row.email, cancelled: true };
}

export async function removeVipMember(id: string) {
  const member = await query<{
    id: string;
    email: string;
    is_active: boolean;
    unsubscribed_at: string | null;
  }>(`SELECT id, email, is_active, unsubscribed_at FROM vip_members WHERE id = $1`, [id]);

  const row = member.rows[0];
  if (!row) {
    throw new Error("VIP member not found");
  }
  if (row.is_active) {
    throw new Error("Cancel the membership before removing this record");
  }

  await query(`DELETE FROM vip_members WHERE id = $1`, [id]);

  await createAdminNotification({
    type: "vip_removed",
    title: "VIP record removed",
    message: `${row.email} was permanently deleted from the system.`,
    metadata: { email: row.email },
  });

  return { email: row.email, removed: true };
}
