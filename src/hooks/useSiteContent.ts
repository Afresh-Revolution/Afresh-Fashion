"use client";

import { useEffect, useState } from "react";
import type { SiteContent } from "@/types/content";

const EMPTY: SiteContent = {
  settings: null,
  hero: null,
  about: null,
  aboutStats: [],
  marquees: [],
  collectionsSection: null,
  collections: [],
  lookbookSection: null,
  lookbook: [],
  shopSection: null,
  productCategories: [],
  products: [],
  drop: null,
  communitySection: null,
  community: [],
  collaborators: [],
  editorialSection: null,
  editorial: [],
  membership: null,
  membershipPerks: [],
  contact: null,
  footer: null,
  helpPages: [],
  cinematic: null,
  cinematicVideos: [],
};

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/content")
      .then((r) => (r.ok ? r.json() : EMPTY))
      .then((data) => setContent({ ...EMPTY, ...data }))
      .catch(() => setContent(EMPTY))
      .finally(() => setLoaded(true));
  }, []);

  return { content, loaded };
}

/** Placeholder image until admin uploads to Backblaze. */
export function placeholderImage(seed: string, width: number, height: number) {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

export function resolveImage(seed: string, url: string | null | undefined, width: number, height: number) {
  return url || placeholderImage(seed, width, height);
}

export function formatNaira(amount: number, symbol = "₦") {
  return `${symbol}${amount.toLocaleString("en-NG")}`;
}

export function productBadgeLabel(badge: string) {
  if (badge === "new") return "New";
  if (badge === "limited") return "Limited";
  return null;
}
