import { query } from "@/lib/db";
import { computeShippingAmount } from "@/lib/api-security";
import { loadProductImageMap, resolveProductImageUrls } from "@/lib/product-images";
import type { CheckoutForm, OrderSummary } from "@/types/cart";
import { getCartForSession } from "@/lib/cart";

export type CreateOrderInput = CheckoutForm & {
  sessionToken: string;
};

export async function createOrderFromCart(input: CreateOrderInput) {
  const cart = await getCartForSession(input.sessionToken);
  if (!cart || cart.items.length === 0) {
    throw new Error("Your bag is empty");
  }

  const subtotal = cart.subtotal_amount;
  const shipping = computeShippingAmount(subtotal);
  const total = subtotal + shipping;

  if (total <= 0) {
    throw new Error("Invalid order total");
  }

  const shipping_address = {
    line1: input.address_line1,
    line2: input.address_line2 || "",
    city: input.city,
    state: input.state,
    country: input.country,
    postal_code: input.postal_code || "",
  };

  const imageMap = await loadProductImageMap();

  const order = await query<{
    id: string;
    order_number: string;
  }>(
    `INSERT INTO orders (
       cart_id, email, full_name, phone, shipping_name, shipping_address, customer_notes,
       status, payment_status, currency_code, subtotal_amount, shipping_amount, total_amount, notes
     ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, 'pending', 'unpaid', 'NGN', $8, $9, $10, $7)
     RETURNING id, order_number`,
    [
      cart.id,
      input.email.trim().toLowerCase(),
      input.full_name.trim(),
      input.phone.trim(),
      input.full_name.trim(),
      JSON.stringify(shipping_address),
      input.customer_notes?.trim() || null,
      subtotal,
      shipping,
      total,
    ]
  );

  const orderId = order.rows[0].id;

  for (const item of cart.items) {
    const urls = resolveProductImageUrls(item.image_url, imageMap.get(item.product_id));
    await query(
      `INSERT INTO order_items (
         order_id, product_id, product_name, product_slug, product_image_url,
         quantity, unit_price, line_total
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        orderId,
        item.product_id,
        item.name,
        item.slug,
        urls[0] ?? item.image_url,
        item.quantity,
        item.unit_price,
        item.line_total,
      ]
    );
  }

  return getOrderById(orderId);
}

export async function getOrderById(orderId: string): Promise<OrderSummary | null> {
  const { rows } = await query<{
    id: string;
    order_number: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    status: string;
    payment_method: string | null;
    payment_status: string;
    subtotal_amount: string;
    shipping_amount: string;
    total_amount: string;
    currency_code: string;
    shipping_address: Record<string, string> | null;
    customer_notes: string | null;
  }>(
    `SELECT id, order_number, email, full_name, phone, status, payment_method, payment_status,
            subtotal_amount, shipping_amount, total_amount, currency_code, shipping_address, customer_notes
     FROM orders WHERE id = $1`,
    [orderId]
  );
  if (!rows[0]) return null;

  const items = await query<{
    id: string;
    product_name: string;
    product_slug: string | null;
    product_image_url: string | null;
    quantity: number;
    unit_price: string;
    line_total: string;
  }>(
    `SELECT id, product_name, product_slug, product_image_url, quantity, unit_price, line_total
     FROM order_items WHERE order_id = $1`,
    [orderId]
  );

  return {
    id: rows[0].id,
    order_number: rows[0].order_number,
    email: rows[0].email,
    full_name: rows[0].full_name,
    phone: rows[0].phone,
    status: rows[0].status,
    payment_method: rows[0].payment_method,
    payment_status: rows[0].payment_status,
    subtotal_amount: Number(rows[0].subtotal_amount),
    shipping_amount: Number(rows[0].shipping_amount),
    total_amount: Number(rows[0].total_amount),
    currency_code: rows[0].currency_code,
    shipping_address: rows[0].shipping_address,
    customer_notes: rows[0].customer_notes,
    items: items.rows.map((i) => ({
      id: i.id,
      product_name: i.product_name,
      product_slug: i.product_slug,
      product_image_url: i.product_image_url,
      quantity: i.quantity,
      unit_price: Number(i.unit_price),
      line_total: Number(i.line_total),
    })),
  };
}

export async function markManualPaymentPending(orderId: string) {
  await query(
    `UPDATE orders SET
       payment_method = 'manual',
       payment_status = 'awaiting_confirmation',
       manual_paid_at = NOW()
     WHERE id = $1`,
    [orderId]
  );
}

export async function markOrderPaidPaystack(orderId: string, reference: string) {
  await query(
    `UPDATE orders SET
       payment_method = 'paystack',
       payment_status = 'paid',
       status = 'paid',
       paystack_reference = $2,
       paid_at = NOW()
     WHERE id = $1`,
    [orderId, reference]
  );

  const cart = await query<{ cart_id: string }>(`SELECT cart_id FROM orders WHERE id = $1`, [orderId]);
  if (cart.rows[0]?.cart_id) {
    await query(`UPDATE carts SET status = 'converted', converted_at = NOW() WHERE id = $1`, [
      cart.rows[0].cart_id,
    ]);
  }
}

export async function confirmManualOrder(
  orderId: string,
  delivery: { expected_delivery_at: string; delivery_message: string }
) {
  await query(
    `UPDATE orders SET
       payment_status = 'paid',
       status = 'processing',
       paid_at = COALESCE(paid_at, NOW()),
       expected_delivery_at = $2::timestamptz,
       delivery_message = $3
     WHERE id = $1`,
    [orderId, delivery.expected_delivery_at, delivery.delivery_message]
  );
}
