import { query } from "@/lib/db";
import { getSiteUrl, sendEmail } from "@/lib/resend";
import {
  adminManualPaymentEmail,
  adminPaystackPaidEmail,
  customerOrderConfirmedEmail,
  customerPaystackReceiptEmail,
} from "@/lib/emails/order-templates";
import type { OrderSummary } from "@/types/cart";

function adminEmail() {
  return process.env.ADMIN_NOTIFY_EMAIL;
}

export async function insertAdminNotification(
  type: string,
  title: string,
  message: string,
  metadata: Record<string, unknown> = {}
) {
  await query(
    `INSERT INTO admin_notifications (type, title, message, metadata) VALUES ($1, $2, $3, $4::jsonb)`,
    [type, title, message, JSON.stringify(metadata)]
  );
}

export async function notifyManualPaymentSubmitted(order: OrderSummary, request?: Request) {
  const siteUrl = getSiteUrl(request);
  await insertAdminNotification(
    "order_manual_payment",
    `Manual payment: ${order.order_number}`,
    `${order.full_name || order.email} marked order as paid — ${order.total_amount} NGN`,
    { order_id: order.id, order_number: order.order_number }
  );

  const admin = adminEmail();
  if (admin) {
    const tpl = adminManualPaymentEmail(order, siteUrl);
    await sendEmail({ to: admin, subject: tpl.subject, html: tpl.html });
  }
}

export async function notifyPaystackPaid(order: OrderSummary, request?: Request) {
  const siteUrl = getSiteUrl(request);
  await insertAdminNotification(
    "order_paid",
    `Paid order: ${order.order_number}`,
    `Paystack payment confirmed — plan delivery`,
    { order_id: order.id }
  );

  const admin = adminEmail();
  if (admin) {
    const tpl = adminPaystackPaidEmail(order, siteUrl);
    await sendEmail({ to: admin, subject: tpl.subject, html: tpl.html });
  }

  const receipt = customerPaystackReceiptEmail(order);
  await sendEmail({ to: order.email, subject: receipt.subject, html: receipt.html });
}

export async function sendOrderConfirmedToCustomer(
  order: OrderSummary,
  delivery: { expected_delivery_at: string; delivery_message: string }
) {
  const tpl = customerOrderConfirmedEmail(order, delivery);
  await sendEmail({ to: order.email, subject: tpl.subject, html: tpl.html });
}
