import { ctaButton, emailLayout } from "@/lib/emails/layout";
import type { OrderSummary } from "@/types/cart";

function esc(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function orderItemsHtml(order: OrderSummary) {
  return order.items
    .map(
      (i) => `
    <tr>
      <td style="padding:8px 0;color:#BFC0C0;">${esc(i.product_name)} × ${i.quantity}</td>
      <td style="padding:8px 0;color:#F5F5F5;text-align:right;">${formatNaira(i.line_total)}</td>
    </tr>`
    )
    .join("");
}

export function adminManualPaymentEmail(order: OrderSummary, siteUrl?: string) {
  const adminUrl = `${siteUrl || ""}/admin`;
  const body = `
    <h1 style="margin:0 0 12px;font-size:18px;color:#C8A96B;">Manual payment to confirm</h1>
    <p style="color:#BFC0C0;margin:0 0 8px;">
      Order <strong style="color:#F5F5F5;">${esc(order.order_number)}</strong> — customer marked as paid.
    </p>
    <p style="color:#BFC0C0;margin:0 0 4px;">${esc(order.full_name || "")} · ${esc(order.email)} · ${esc(order.phone || "")}</p>
    <p style="color:#C8A96B;font-size:18px;margin:16px 0;">Total: ${formatNaira(order.total_amount)}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${orderItemsHtml(order)}</table>
    ${ctaButton("Review in admin", adminUrl)}
  `;
  return {
    subject: `Payment to confirm: ${order.order_number}`,
    html: emailLayout(body),
  };
}

export function adminPaystackPaidEmail(order: OrderSummary, siteUrl?: string) {
  const adminUrl = `${siteUrl || ""}/admin`;
  const body = `
    <h1 style="margin:0 0 12px;font-size:18px;color:#C8A96B;">New paid order (Paystack)</h1>
    <p style="color:#BFC0C0;">Order <strong style="color:#F5F5F5;">${esc(order.order_number)}</strong> is paid. Plan delivery when ready.</p>
    <p style="color:#C8A96B;font-size:18px;margin:16px 0;">Total: ${formatNaira(order.total_amount)}</p>
    ${ctaButton("Open orders", adminUrl)}
  `;
  return {
    subject: `Paid order: ${order.order_number}`,
    html: emailLayout(body),
  };
}

export function customerOrderConfirmedEmail(
  order: OrderSummary,
  opts: { expected_delivery_at: string; delivery_message: string }
) {
  const deliveryDate = new Date(opts.expected_delivery_at).toLocaleString("en-NG", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#F5F5F5;text-align:center;">Order confirmed ✦</h1>
    <p style="color:#BFC0C0;text-align:center;margin:0 0 16px;">
      Your payment for <strong style="color:#F5F5F5;">${esc(order.order_number)}</strong> is confirmed.
    </p>
    <div style="margin:20px 0;padding:16px 20px;background:rgba(200,169,107,0.08);border-left:3px solid #C8A96B;">
      <p style="margin:0 0 8px;color:#C8A96B;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;">Expected delivery</p>
      <p style="margin:0 0 12px;color:#F5F5F5;">${esc(deliveryDate)}</p>
      <p style="margin:0;color:#BFC0C0;white-space:pre-line;">${esc(opts.delivery_message)}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;">${orderItemsHtml(order)}</table>
    <p style="color:#C8A96B;text-align:center;margin-top:16px;font-size:18px;">Total paid: ${formatNaira(order.total_amount)}</p>
  `;
  return {
    subject: `Your AFRESH order ${order.order_number} is confirmed`,
    html: emailLayout(body),
  };
}

export function customerPaystackReceiptEmail(order: OrderSummary) {
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#F5F5F5;text-align:center;">Thank you for your order</h1>
    <p style="color:#BFC0C0;text-align:center;margin:0 0 20px;">
      Payment received for order <strong style="color:#F5F5F5;">${esc(order.order_number)}</strong>.
      We&apos;ll share delivery details soon.
    </p>
    <table style="width:100%;border-collapse:collapse;">${orderItemsHtml(order)}</table>
    <p style="color:#C8A96B;text-align:center;margin-top:16px;font-size:18px;">Total: ${formatNaira(order.total_amount)}</p>
  `;
  return {
    subject: `AFRESH order ${order.order_number} — payment received`,
    html: emailLayout(body),
  };
}
