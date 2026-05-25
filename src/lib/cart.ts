import { query } from "@/lib/db";
import { loadProductImageMap, resolveProductImageUrls } from "@/lib/product-images";
import {
  getCartSessionToken,
  newCartSessionToken,
  setCartSessionCookie,
} from "@/lib/cart-session";
import type { CartLineItem, CartResponse } from "@/types/cart";

async function ensureCart(sessionToken: string): Promise<string> {
  const existing = await query<{ id: string }>(
    `SELECT id FROM carts WHERE session_token = $1 AND status = 'active' LIMIT 1`,
    [sessionToken]
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const created = await query<{ id: string }>(
    `INSERT INTO carts (session_token, status) VALUES ($1, 'active') RETURNING id`,
    [sessionToken]
  );
  return created.rows[0].id;
}

export async function getOrCreateSession(): Promise<string> {
  let token = await getCartSessionToken();
  if (!token) {
    token = newCartSessionToken();
    await setCartSessionCookie(token);
  }
  await ensureCart(token);
  return token;
}

export async function getCartForSession(sessionToken: string): Promise<CartResponse | null> {
  const cartRow = await query<{
    id: string;
    item_count: number;
    subtotal_amount: string;
    currency_code: string;
  }>(
    `SELECT id, item_count, subtotal_amount, currency_code
     FROM carts WHERE session_token = $1 AND status = 'active' LIMIT 1`,
    [sessionToken]
  );
  if (!cartRow.rows[0]) return null;

  const { rows } = await query<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price: string;
    product_name: string;
    slug: string;
    stock_quantity: number;
    image_url: string | null;
  }>(
    `SELECT ci.id, ci.product_id, ci.quantity, ci.unit_price, ci.product_name,
            p.slug, p.stock_quantity, p.image_url
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at ASC`,
    [cartRow.rows[0].id]
  );

  const imageMap = await loadProductImageMap();

  const items: CartLineItem[] = rows.map((r) => {
    const image_urls = resolveProductImageUrls(r.image_url, imageMap.get(r.product_id));
    const unit = Number(r.unit_price);
    return {
      id: r.id,
      product_id: r.product_id,
      slug: r.slug,
      name: r.product_name,
      quantity: r.quantity,
      unit_price: unit,
      line_total: unit * r.quantity,
      image_url: image_urls[0] ?? r.image_url,
      image_urls,
      stock_quantity: r.stock_quantity,
    };
  });

  return {
    id: cartRow.rows[0].id,
    item_count: cartRow.rows[0].item_count,
    subtotal_amount: Number(cartRow.rows[0].subtotal_amount),
    currency_code: cartRow.rows[0].currency_code,
    items,
  };
}

export async function addProductToCart(sessionToken: string, productId: string, quantity = 1) {
  const cartId = await ensureCart(sessionToken);

  const product = await query<{
    id: string;
    name: string;
    price_amount: string;
    stock_quantity: number;
    status: string;
  }>(
    `SELECT id, name, price_amount, stock_quantity, status FROM products WHERE id = $1`,
    [productId]
  );
  if (!product.rows[0] || product.rows[0].status !== "published") {
    throw new Error("Product not available");
  }
  if (product.rows[0].stock_quantity < quantity) {
    throw new Error("Not enough stock");
  }

  const price = Number(product.rows[0].price_amount);

  await query(
    `INSERT INTO cart_items (cart_id, product_id, quantity, unit_price, product_name)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (cart_id, product_id) DO UPDATE SET
       quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, $6),
       unit_price = EXCLUDED.unit_price,
       product_name = EXCLUDED.product_name`,
    [cartId, productId, quantity, price, product.rows[0].name, product.rows[0].stock_quantity]
  );

  return getCartForSession(sessionToken);
}

export async function updateCartItemQuantity(
  sessionToken: string,
  productId: string,
  quantity: number
) {
  const cart = await getCartForSession(sessionToken);
  if (!cart) throw new Error("Cart not found");

  if (quantity <= 0) {
    await query(`DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`, [
      cart.id,
      productId,
    ]);
    return getCartForSession(sessionToken);
  }

  const stock = await query<{ stock_quantity: number }>(
    `SELECT stock_quantity FROM products WHERE id = $1`,
    [productId]
  );
  if (!stock.rows[0] || stock.rows[0].stock_quantity < quantity) {
    throw new Error("Not enough stock");
  }

  await query(
    `UPDATE cart_items SET quantity = $3 WHERE cart_id = $1 AND product_id = $2`,
    [cart.id, productId, quantity]
  );

  return getCartForSession(sessionToken);
}

export async function removeCartItem(sessionToken: string, productId: string) {
  const cart = await getCartForSession(sessionToken);
  if (!cart) return null;
  await query(`DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`, [
    cart.id,
    productId,
  ]);
  return getCartForSession(sessionToken);
}
