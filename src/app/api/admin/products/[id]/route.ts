import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";
import { loadProductImageMap, replaceProductImages, resolveProductImageUrls } from "@/lib/product-images";

type Params = { params: Promise<{ id: string }> };

function normalizeBadge(badge?: string) {
  if (!badge) return undefined;
  if (badge === "New" || badge === "new") return "new";
  if (badge === "Limited" || badge === "limited") return "limited";
  return badge === "none" ? "none" : badge;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    let categoryId: string | undefined;
    if (body.category_slug) {
      const cat = await query<{ id: string }>(
        `SELECT id FROM product_categories WHERE slug = $1`,
        [body.category_slug]
      );
      if (!cat.rows[0]) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      categoryId = cat.rows[0].id;
    }

    const badge = normalizeBadge(body.badge);
    await query(
      `UPDATE products SET
         category_id = COALESCE($2, category_id),
         slug = COALESCE($3, slug),
         name = COALESCE($4, name),
         price_amount = COALESCE($5, price_amount),
         badge = COALESCE($6, badge),
         stock_quantity = COALESCE($7, stock_quantity),
         image_url = COALESCE($8, image_url),
         sort_order = COALESCE($9, sort_order),
         status = COALESCE($10, status)
       WHERE id = $1`,
      [
        id,
        categoryId,
        body.slug,
        body.name,
        body.price_amount,
        badge,
        body.stock_quantity,
        body.image_url,
        body.sort_order,
        body.status,
      ]
    );

    if (Array.isArray(body.swatches)) {
      await query(`DELETE FROM product_color_swatches WHERE product_id = $1`, [id]);
      for (let i = 0; i < body.swatches.length; i++) {
        await query(
          `INSERT INTO product_color_swatches (product_id, hex_color, sort_order) VALUES ($1, $2, $3)`,
          [id, body.swatches[i], i]
        );
      }
    }

    if (Array.isArray(body.image_urls)) {
      await replaceProductImages(id, body.image_urls);
    } else if (body.image_url !== undefined) {
      await replaceProductImages(id, body.image_url ? [body.image_url] : []);
    }

    const { rows } = await query(
      `SELECT p.id, p.slug, p.name, p.price_amount, pc.slug AS category_slug, pc.name AS category_name,
              p.badge, p.stock_quantity, p.image_url, p.sort_order, p.status
       FROM products p
       JOIN product_categories pc ON pc.id = p.category_id
       WHERE p.id = $1`,
      [id]
    );
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const sw = await query<{ hex_color: string }>(
      `SELECT hex_color FROM product_color_swatches WHERE product_id = $1 ORDER BY sort_order`,
      [id]
    );
    const imageMap = await loadProductImageMap();
    const image_urls = resolveProductImageUrls(rows[0].image_url, imageMap.get(id));
    return NextResponse.json({
      ...rows[0],
      price_amount: Number(rows[0].price_amount),
      image_url: image_urls[0] ?? rows[0].image_url,
      image_urls,
      swatches: sw.rows.map((r) => r.hex_color),
    });
  } catch (err) {
    return adminError(err);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    await query(`DELETE FROM products WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminError(err);
  }
}
