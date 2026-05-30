import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { loadProductImageMap, resolveProductImageUrls } from "@/lib/product-images";
import { apiErrorResponse } from "@/lib/safe-api-error";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().slice(0, 80);
    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const pattern = `%${q.replace(/%/g, "\\%")}%`;

    const { rows } = await query<{
      id: string;
      slug: string;
      name: string;
      price_amount: string;
      image_url: string | null;
      category_name: string;
    }>(
      `SELECT p.id, p.slug, p.name, p.price_amount, p.image_url, pc.name AS category_name
       FROM products p
       JOIN product_categories pc ON pc.id = p.category_id
       WHERE p.status = 'published'
         AND (p.name ILIKE $1 OR p.slug ILIKE $1 OR pc.name ILIKE $1)
       ORDER BY p.sort_order ASC
       LIMIT 20`,
      [pattern]
    );

    const imageMap = await loadProductImageMap();

    return NextResponse.json({
      results: rows.map((r) => {
        const image_urls = resolveProductImageUrls(r.image_url, imageMap.get(r.id));
        return {
          id: r.id,
          slug: r.slug,
          name: r.name,
          price_amount: Number(r.price_amount),
          category_name: r.category_name,
          image_url: image_urls[0] ?? r.image_url,
        };
      }),
    });
  } catch (err) {
    return apiErrorResponse(err, "Search failed", 500);
  }
}
