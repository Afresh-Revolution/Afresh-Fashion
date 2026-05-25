import { query } from "@/lib/db";
import type {
  CinematicVideo,
  CollectionItem,
  CollaboratorItem,
  CommunityItem,
  EditorialItem,
  LookbookItem,
  ProductItem,
  SiteContent,
} from "@/types/content";

type CollectionRow = {
  id: string;
  chapter: string;
  title: string;
  description: string;
  image_url: string | null;
  slug: string | null;
  sort_order: number;
  status: string;
};

type LookbookRow = {
  id: string;
  label: string;
  image_url: string | null;
  sort_order: number;
  status: string;
};

export async function getSiteContent(): Promise<SiteContent> {
  const [collections, lookbook, products, community, collaborators, editorial, cinematicRows, videoRows] =
    await Promise.all([
      query<CollectionRow>(
        `SELECT id, chapter, title, description, image_url, slug, sort_order, status
         FROM collections ORDER BY sort_order ASC`
      ),
      query<LookbookRow>(
        `SELECT id, label, image_url, sort_order, status
         FROM lookbook_looks ORDER BY sort_order ASC`
      ),
      query<{
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
      ),
      query<{
        id: string;
        handle: string;
        image_url: string | null;
        is_featured: boolean;
        is_large_tile: boolean;
        sort_order: number;
        status: string;
      }>(
        `SELECT id, handle, image_url, is_featured, is_large_tile, sort_order, status
         FROM community_posts ORDER BY sort_order ASC`
      ),
      query<{
        id: string;
        name: string;
        role: string;
        avatar_url: string | null;
        is_wide_tile: boolean;
        sort_order: number;
        status: string;
      }>(
        `SELECT id, name, role, avatar_url, is_wide_tile, sort_order, status
         FROM collaborators ORDER BY sort_order ASC`
      ),
      query<{
        id: string;
        layout: "featured" | "card" | "mini";
        tag: string;
        title: string;
        excerpt: string | null;
        meta_text: string | null;
        image_url: string | null;
        sort_order: number;
        status: string;
      }>(
        `SELECT id, layout, tag, title, excerpt, meta_text, image_url, sort_order, status
         FROM editorial_articles ORDER BY sort_order ASC`
      ),
      query<{
        quote: string;
        attribution: string;
        image_url: string | null;
        toast_message: string;
      }>(`SELECT quote, attribution, image_url, toast_message FROM cinematic_section WHERE id = 1`),
      query<{
        id: string;
        title: string | null;
        video_url: string;
        poster_url: string | null;
        sort_order: number;
        status: string;
      }>(
        `SELECT id, title, video_url, poster_url, sort_order, status
         FROM cinematic_videos ORDER BY sort_order ASC`
      ),
    ]);

  const swatchRows = await query<{ product_id: string; hex_color: string }>(
    `SELECT product_id, hex_color FROM product_color_swatches ORDER BY sort_order ASC`
  );
  const swatchMap = new Map<string, string[]>();
  for (const s of swatchRows.rows) {
    const list = swatchMap.get(s.product_id) ?? [];
    list.push(s.hex_color);
    swatchMap.set(s.product_id, list);
  }

  return {
    collections: collections.rows.map((r) => ({
      id: r.id,
      chapter: r.chapter,
      title: r.title,
      description: r.description,
      image_url: r.image_url,
      slug: r.slug,
      sort_order: r.sort_order,
      status: r.status as CollectionItem["status"],
    })),
    lookbook: lookbook.rows.map((r) => ({
      id: r.id,
      label: r.label,
      image_url: r.image_url,
      sort_order: r.sort_order,
      status: r.status as LookbookItem["status"],
    })),
    products: products.rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      price_amount: Number(r.price_amount),
      category_slug: r.category_slug,
      category_name: r.category_name,
      badge: r.badge,
      stock_quantity: r.stock_quantity,
      image_url: r.image_url,
      sort_order: r.sort_order,
      status: r.status as ProductItem["status"],
      swatches: swatchMap.get(r.id) ?? [],
    })),
    community: community.rows.map((r) => ({
      id: r.id,
      handle: r.handle,
      image_url: r.image_url,
      is_featured: r.is_featured,
      is_large_tile: r.is_large_tile,
      sort_order: r.sort_order,
      status: r.status as CommunityItem["status"],
    })),
    collaborators: collaborators.rows.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      avatar_url: r.avatar_url,
      is_wide_tile: r.is_wide_tile,
      sort_order: r.sort_order,
      status: r.status as CollaboratorItem["status"],
    })),
    editorial: editorial.rows.map((r) => ({
      id: r.id,
      layout: r.layout,
      tag: r.tag,
      title: r.title,
      excerpt: r.excerpt,
      meta_text: r.meta_text,
      image_url: r.image_url,
      sort_order: r.sort_order,
      status: r.status as EditorialItem["status"],
    })),
    cinematic: cinematicRows.rows[0] ?? null,
    cinematicVideos: videoRows.rows.map((r) => ({
      id: r.id,
      title: r.title,
      video_url: r.video_url,
      poster_url: r.poster_url,
      sort_order: r.sort_order,
      status: r.status as CinematicVideo["status"],
    })),
  };
}

export function published<T extends { status: string }>(items: T[]) {
  return items.filter((i) => i.status === "published");
}
