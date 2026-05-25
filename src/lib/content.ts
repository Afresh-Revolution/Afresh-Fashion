import { query } from "@/lib/db";
import {
  loadHeroBackgroundUrls,
  resolveHeroBackgroundUrls,
} from "@/lib/hero-images";
import { loadProductImageMap, resolveProductImageUrls } from "@/lib/product-images";
import type {
  AboutSection,
  CinematicVideo,
  CollectionItem,
  CollaboratorItem,
  CommunityItem,
  ContactSection,
  DropSection,
  EditorialItem,
  FooterContent,
  HelpPage,
  HeroSection,
  LookbookItem,
  MarqueeBand,
  MembershipPerk,
  MembershipSection,
  ProductCategory,
  ProductItem,
  SectionHeader,
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
  const [
    settingsRows,
    heroRows,
    aboutRows,
    aboutStatsRows,
    marqueeBandRows,
    marqueeItemRows,
    collectionsSectionRows,
    collections,
    lookbookSectionRows,
    lookbook,
    shopSectionRows,
    categories,
    products,
    dropRows,
    communitySectionRows,
    community,
    collaborators,
    editorialSectionRows,
    editorial,
    membershipRows,
    perksRows,
    contactRows,
    footerRows,
    footerGroups,
    footerLinks,
    socialRows,
    cinematicRows,
    videoRows,
    helpRows,
  ] = await Promise.all([
    query<{ brand_name: string; season_label: string; currency_symbol: string }>(
      `SELECT brand_name, season_label, currency_symbol FROM site_settings WHERE id = 1`
    ),
    query<HeroSection>(
      `SELECT background_url, tagline, title, subtitle, cta_primary_label, cta_primary_href,
              cta_secondary_label, cta_secondary_href, side_label, scroll_label
       FROM hero_section WHERE id = 1 AND status = 'published'`
    ),
    query<AboutSection>(
      `SELECT section_label, heading_line_1, heading_line_2, lead_paragraph, body_paragraph_1,
              body_paragraph_2, cta_label, cta_href
       FROM about_section WHERE id = 1 AND status = 'published'`
    ),
    query<{
      id: string;
      value_numeric: number | null;
      is_symbolic: boolean;
      symbol_text: string | null;
      label: string;
    }>(
      `SELECT id, value_numeric, is_symbolic, symbol_text, label
       FROM about_stats WHERE status = 'published' ORDER BY sort_order ASC`
    ),
    query<{ slug: string; direction: "forward" | "reverse" }>(
      `SELECT slug, direction FROM marquee_bands WHERE status = 'published' ORDER BY sort_order ASC`
    ),
    query<{ band_slug: string; text: string }>(
      `SELECT b.slug AS band_slug, mi.text
       FROM marquee_items mi
       JOIN marquee_bands b ON b.id = mi.band_id
       WHERE mi.status = 'published' AND b.status = 'published'
       ORDER BY mi.sort_order ASC`
    ),
    query<SectionHeader>(
      `SELECT section_label, heading, view_all_label, view_all_href
       FROM collections_section WHERE id = 1 AND status = 'published'`
    ),
    query<CollectionRow>(
      `SELECT id, chapter, title, description, image_url, slug, sort_order, status
       FROM collections ORDER BY sort_order ASC`
    ),
    query<SectionHeader & { description: string }>(
      `SELECT section_label, heading, description
       FROM lookbook_section WHERE id = 1 AND status = 'published'`
    ),
    query<LookbookRow>(
      `SELECT id, label, image_url, sort_order, status FROM lookbook_looks ORDER BY sort_order ASC`
    ),
    query<SectionHeader>(
      `SELECT section_label, heading, view_all_label, view_all_href
       FROM shop_section WHERE id = 1 AND status = 'published'`
    ),
    query<ProductCategory>(`SELECT slug, name FROM product_categories WHERE status = 'published' ORDER BY sort_order`),
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
    query<DropSection>(
      `SELECT section_label, heading, title, subtitle, pieces_worldwide, drop_at::text, background_url,
              cta_primary_label, cta_secondary_label, footnote
       FROM drops WHERE is_active = TRUE AND status = 'published' LIMIT 1`
    ),
    query<SectionHeader & { description: string; instagram_handle: string }>(
      `SELECT section_label, heading, description, instagram_handle
       FROM community_section WHERE id = 1 AND status = 'published'`
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
    query<SectionHeader>(
      `SELECT section_label, heading, read_all_label, read_all_href
       FROM editorial_section WHERE id = 1 AND status = 'published'`
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
    query<MembershipSection>(
      `SELECT section_label, heading_line_1, heading_line_2, heading_line_2_gold, description,
              signup_placeholder, signup_button_label, footnote, background_url
       FROM membership_section WHERE id = 1 AND status = 'published'`
    ),
    query<MembershipPerk>(
      `SELECT icon_key, title, description FROM membership_perks WHERE status = 'published' ORDER BY sort_order`
    ),
    query<ContactSection>(
      `SELECT section_label, heading, intro_text, email, location, shipping_note
       FROM contact_section WHERE id = 1 AND status = 'published'`
    ),
    query<{ tagline: string; copyright_text: string; cities_line: string; stealth_ref: string }>(
      `SELECT tagline, copyright_text, cities_line, stealth_ref FROM footer_content WHERE id = 1 AND status = 'published'`
    ),
    query<{ id: string; title: string }>(
      `SELECT id, title FROM footer_link_groups WHERE status = 'published' ORDER BY sort_order`
    ),
    query<{ group_title: string; label: string; href: string }>(
      `SELECT g.title AS group_title, fl.label, fl.href
       FROM footer_links fl
       JOIN footer_link_groups g ON g.id = fl.group_id
       WHERE fl.status = 'published' AND g.status = 'published'
       ORDER BY fl.sort_order`
    ),
    query<{ platform: string; url: string; icon_key: string }>(
      `SELECT platform, url, icon_key FROM social_links WHERE status = 'published' ORDER BY sort_order`
    ),
    query<{
      quote: string;
      attribution: string;
      image_url: string | null;
      toast_message: string;
    }>(`SELECT quote, attribution, image_url, toast_message FROM cinematic_section WHERE id = 1 AND status = 'published'`),
    query<{
      id: string;
      title: string | null;
      video_url: string;
      poster_url: string | null;
      sort_order: number;
      status: string;
    }>(`SELECT id, title, video_url, poster_url, sort_order, status FROM cinematic_videos ORDER BY sort_order ASC`),
    query<HelpPage>(
      `SELECT slug, title, body, diagram_url, diagram_caption, contact_email
       FROM help_pages WHERE status = 'published' ORDER BY sort_order ASC`
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

  const [heroBackgroundUrls, productImageMap] = await Promise.all([
    loadHeroBackgroundUrls(),
    loadProductImageMap(),
  ]);
  const heroRow = heroRows.rows[0];
  const hero = heroRow
    ? {
        ...heroRow,
        background_urls: resolveHeroBackgroundUrls(heroRow.background_url, heroBackgroundUrls),
      }
    : null;

  const marqueeMap = new Map<string, string[]>();
  for (const item of marqueeItemRows.rows) {
    const list = marqueeMap.get(item.band_slug) ?? [];
    list.push(item.text);
    marqueeMap.set(item.band_slug, list);
  }
  const marquees: MarqueeBand[] = marqueeBandRows.rows.map((b) => ({
    slug: b.slug,
    direction: b.direction,
    items: marqueeMap.get(b.slug) ?? [],
  }));

  const linkGroupMap = new Map<string, FooterContent["link_groups"][0]>();
  for (const g of footerGroups.rows) {
    linkGroupMap.set(g.title, { title: g.title, links: [] });
  }
  for (const link of footerLinks.rows) {
    const group = linkGroupMap.get(link.group_title);
    if (group) group.links.push({ label: link.label, href: link.href });
  }

  const footerRow = footerRows.rows[0];
  const footer: FooterContent | null = footerRow
    ? {
        ...footerRow,
        link_groups: [...linkGroupMap.values()],
        social: socialRows.rows,
      }
    : null;

  const lookbookSec = lookbookSectionRows.rows[0];

  return {
    settings: settingsRows.rows[0] ?? null,
    hero,
    about: aboutRows.rows[0] ?? null,
    aboutStats: aboutStatsRows.rows.map((r) => ({
      id: r.id,
      value_numeric: r.value_numeric,
      is_symbolic: r.is_symbolic,
      symbol_text: r.symbol_text,
      label: r.label,
    })),
    marquees,
    collectionsSection: collectionsSectionRows.rows[0] ?? null,
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
    lookbookSection: lookbookSec
      ? {
          section_label: lookbookSec.section_label,
          heading: lookbookSec.heading,
          description: lookbookSec.description,
        }
      : null,
    lookbook: lookbook.rows.map((r) => ({
      id: r.id,
      label: r.label,
      image_url: r.image_url,
      sort_order: r.sort_order,
      status: r.status as LookbookItem["status"],
    })),
    shopSection: shopSectionRows.rows[0] ?? null,
    productCategories: categories.rows,
    products: products.rows.map((r) => {
      const image_urls = resolveProductImageUrls(r.image_url, productImageMap.get(r.id));
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        price_amount: Number(r.price_amount),
        category_slug: r.category_slug,
        category_name: r.category_name,
        badge: r.badge,
        stock_quantity: r.stock_quantity,
        image_url: image_urls[0] ?? r.image_url,
        image_urls,
        sort_order: r.sort_order,
        status: r.status as ProductItem["status"],
        swatches: swatchMap.get(r.id) ?? [],
      };
    }),
    drop: dropRows.rows[0] ?? null,
    communitySection: communitySectionRows.rows[0]
      ? {
          section_label: communitySectionRows.rows[0].section_label,
          heading: communitySectionRows.rows[0].heading,
          description: communitySectionRows.rows[0].description,
          instagram_handle: communitySectionRows.rows[0].instagram_handle,
        }
      : null,
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
    editorialSection: editorialSectionRows.rows[0] ?? null,
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
    membership: membershipRows.rows[0] ?? null,
    membershipPerks: perksRows.rows,
    contact: contactRows.rows[0] ?? null,
    footer,
    helpPages: helpRows.rows,
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
