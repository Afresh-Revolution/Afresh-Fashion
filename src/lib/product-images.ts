import { query } from "@/lib/db";

export async function loadProductImageMap(): Promise<Map<string, string[]>> {
  const { rows } = await query<{ product_id: string; image_url: string }>(
    `SELECT product_id, image_url FROM product_images ORDER BY sort_order ASC, created_at ASC`
  );
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.product_id) ?? [];
    list.push(row.image_url);
    map.set(row.product_id, list);
  }
  return map;
}

export async function replaceProductImages(productId: string, urls: string[]) {
  const cleaned = urls.map((u) => u.trim()).filter(Boolean);
  await query(`DELETE FROM product_images WHERE product_id = $1`, [productId]);
  for (let i = 0; i < cleaned.length; i++) {
    await query(
      `INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3)`,
      [productId, cleaned[i], i]
    );
  }
  await query(`UPDATE products SET image_url = $2 WHERE id = $1`, [productId, cleaned[0] ?? null]);
}

export { resolveProductImageUrls } from "@/lib/product-carousel";
