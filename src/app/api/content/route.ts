import { NextResponse } from "next/server";
import { getSiteContent, published } from "@/lib/content";

export async function GET() {
  try {
    const content = await getSiteContent();
    return NextResponse.json({
      collections: published(content.collections),
      lookbook: published(content.lookbook),
      products: published(content.products),
      community: published(content.community),
      collaborators: published(content.collaborators),
      editorial: published(content.editorial),
      cinematic: content.cinematic,
      cinematicVideos: published(content.cinematicVideos),
    });
  } catch (err) {
    console.error("Content fetch error:", err);
    return NextResponse.json({ error: "Failed to load content" }, { status: 500 });
  }
}
