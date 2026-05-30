import { NextResponse } from "next/server";
import { getSiteContent, published } from "@/lib/content";

export async function GET() {
  try {
    const content = await getSiteContent();

    return NextResponse.json(
      {
      settings: content.settings,
      hero: content.hero,
      about: content.about,
      aboutStats: content.aboutStats,
      marquees: content.marquees,
      collectionsSection: content.collectionsSection,
      collections: published(content.collections),
      lookbookSection: content.lookbookSection,
      lookbook: published(content.lookbook),
      shopSection: content.shopSection,
      productCategories: content.productCategories,
      products: published(content.products),
      drop: content.drop,
      communitySection: content.communitySection,
      community: published(content.community),
      collaborators: published(content.collaborators),
      editorialSection: content.editorialSection,
      editorial: published(content.editorial),
      membership: content.membership,
      membershipPerks: content.membershipPerks,
      contact: content.contact,
      footer: content.footer,
      helpPages: content.helpPages,
      cinematic: content.cinematic,
      cinematicVideos: published(content.cinematicVideos).filter((v) => v.video_url),
    },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("Content fetch error:", err);
    return NextResponse.json({ error: "Failed to load content" }, { status: 500 });
  }
}
