import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

export async function GET() {
  try {
    await requireAdmin();

    const [products, alerts, orders, vip, recentAlerts] = await Promise.all([
      query<{ published: string; total_stock: string; total: string }>(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'published')::text AS published,
           COALESCE(SUM(stock_quantity), 0)::text AS total_stock,
           COUNT(*)::text AS total
         FROM products`
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM admin_notifications WHERE read_at IS NULL`
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM orders WHERE payment_status = 'awaiting_confirmation'`
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM vip_members WHERE unsubscribed_at IS NULL`
      ),
      query<{ id: string; title: string; message: string; created_at: string }>(
        `SELECT id, title, message, created_at
         FROM admin_notifications
         WHERE read_at IS NULL
         ORDER BY created_at DESC
         LIMIT 5`
      ),
    ]);

    const productRow = products.rows[0];

    return NextResponse.json({
      publishedProducts: Number(productRow?.published ?? 0),
      totalStock: Number(productRow?.total_stock ?? 0),
      totalProducts: Number(productRow?.total ?? 0),
      unreadAlerts: Number(alerts.rows[0]?.count ?? 0),
      pendingOrders: Number(orders.rows[0]?.count ?? 0),
      vipMembers: Number(vip.rows[0]?.count ?? 0),
      recentAlerts: recentAlerts.rows,
    });
  } catch (err) {
    return adminError(err);
  }
}
