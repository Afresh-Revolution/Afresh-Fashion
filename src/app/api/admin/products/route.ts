import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";
import { loadProductImageMap, replaceProductImages, resolveProductImageUrls } from "@/lib/product-images";

async function productsWithSwatches() {
  const { rows } = await query<{
    id: string;
    slug: string;
    name: string;
    price_amount: string;
    category_slug: string;
    category_name: string;
    badge: string;
    stock_quantity: number;
    image_url: string | null;
    sort_order: number;
    status: string;
  }>(
    `SELECT p.id, p.slug, p.name, p.price_amount, pc.slug AS category_slug, pc.name AS category_name,
            p.badge, p.stock_quantity, p.image_url, p.sort_order, p.status
     FROM products p
     JOIN product_categories pc ON pc.id = p.category_id
     ORDER BY p.sort_order ASC`
  );
  const swatchRows = await query<{ product_id: string; hex_color: string }>(
    `SELECT product_id, hex_color FROM product_color_swatches ORDER BY sort_order ASC`
  );
  const map = new Map<string, string[]>();
  for (const s of swatchRows.rows) {
    const list = map.get(s.product_id) ?? [];
    list.push(s.hex_color);
    map.set(s.product_id, list);
  }
  const imageMap = await loadProductImageMap();
  return rows.map((r) => {
    const image_urls = resolveProductImageUrls(r.image_url, imageMap.get(r.id));
    return {
      ...r,
      price_amount: Number(r.price_amount),
      image_url: image_urls[0] ?? r.image_url,
      image_urls,
      swatches: map.get(r.id) ?? [],
    };
  });
}

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await productsWithSwatches());
  } catch (err) {
    return adminError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const cat = await query<{ id: string }>(
      `SELECT id FROM product_categories WHERE slug = $1`,
      [body.category_slug ?? "tops"]
    );
    if (!cat.rows[0]) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    const badge = body.badge === "New" ? "new" : body.badge === "Limited" ? "limited" : body.badge ?? "none";
    const { rows } = await query<{ id: string }>(
      `INSERT INTO products (category_id, slug, name, price_amount, badge, stock_quantity, image_url, sort_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        cat.rows[0].id,
        body.slug ?? body.name?.toLowerCase().replace(/\s+/g, "-"),
        body.name,
        body.price_amount ?? 0,
        badge,
        body.stock_quantity ?? 0,
        body.image_url ?? null,
        body.sort_order ?? 0,
        body.status ?? "draft",
      ]
    );
    const productId = rows[0].id;
    if (Array.isArray(body.image_urls)) {
      await replaceProductImages(productId, body.image_urls);
    } else if (body.image_url) {
      await replaceProductImages(productId, [body.image_url]);
    }
    if (Array.isArray(body.swatches)) {
      for (let i = 0; i < body.swatches.length; i++) {
        await query(
          `INSERT INTO product_color_swatches (product_id, hex_color, sort_order) VALUES ($1, $2, $3)`,
          [productId, body.swatches[i], i]
        );
      }
    }
    const all = await productsWithSwatches();
    const created = all.find((p) => p.id === productId);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return adminError(err);
  }
}
