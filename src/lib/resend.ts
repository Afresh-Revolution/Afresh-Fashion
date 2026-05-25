import { Resend } from "resend";

let client: Resend | null = null;

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  if (!client) client = new Resend(key);
  return client;
}

export function getFromAddress() {
  return process.env.RESEND_FROM || "AFRESH <onboarding@resend.dev>";
}

export function getSiteUrl(request?: Request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }
  return "http://localhost:3000";
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const resend = getResend();
  const to = Array.isArray(opts.to) ? opts.to : [opts.to];
  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: opts.subject,
    html: opts.html,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function sendBatchEmails(
  messages: { to: string; subject: string; html: string }[]
) {
  if (messages.length === 0) return { sent: 0 };

  const resend = getResend();
  const from = getFromAddress();
  const batchSize = 50;
  let sent = 0;

  for (let i = 0; i < messages.length; i += batchSize) {
    const chunk = messages.slice(i, i + batchSize);
    const { data, error } = await resend.batch.send(
      chunk.map((m) => ({
        from,
        to: [m.to],
        subject: m.subject,
        html: m.html,
      }))
    );
    if (error) throw new Error(error.message);
    sent += data?.length ?? chunk.length;
  }

  return { sent };
}
