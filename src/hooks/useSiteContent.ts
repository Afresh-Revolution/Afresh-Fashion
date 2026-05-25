"use client";

import { useEffect, useState } from "react";
import type { SiteContent } from "@/types/content";

const FALLBACK: SiteContent = {
  collections: [],
  lookbook: [],
  products: [],
  community: [],
  collaborators: [],
  editorial: [],
  cinematic: null,
  cinematicVideos: [],
};

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/content")
      .then((r) => (r.ok ? r.json() : FALLBACK))
      .then((data) => setContent({ ...FALLBACK, ...data }))
      .catch(() => setContent(FALLBACK))
      .finally(() => setLoaded(true));
  }, []);

  return { content, loaded };
}

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function productBadgeLabel(badge: string) {
  if (badge === "new") return "New";
  if (badge === "limited") return "Limited";
  return null;
}
