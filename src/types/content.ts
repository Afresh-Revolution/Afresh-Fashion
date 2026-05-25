export type ContentStatus = "draft" | "published" | "archived";

export interface CollectionItem {
  id: string;
  chapter: string;
  title: string;
  description: string;
  image_url: string | null;
  slug: string | null;
  sort_order: number;
  status: ContentStatus;
}

export interface LookbookItem {
  id: string;
  label: string;
  image_url: string | null;
  sort_order: number;
  status: ContentStatus;
}

export interface ProductItem {
  id: string;
  slug: string;
  name: string;
  price_amount: number;
  category_slug: string;
  category_name: string;
  badge: string;
  stock_quantity: number;
  image_url: string | null;
  sort_order: number;
  status: ContentStatus;
  swatches: string[];
}

export interface CommunityItem {
  id: string;
  handle: string;
  image_url: string | null;
  is_featured: boolean;
  is_large_tile: boolean;
  sort_order: number;
  status: ContentStatus;
}

export interface CollaboratorItem {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  is_wide_tile: boolean;
  sort_order: number;
  status: ContentStatus;
}

export interface EditorialItem {
  id: string;
  layout: "featured" | "card" | "mini";
  tag: string;
  title: string;
  excerpt: string | null;
  meta_text: string | null;
  image_url: string | null;
  sort_order: number;
  status: ContentStatus;
}

export interface CinematicVideo {
  id: string;
  title: string | null;
  video_url: string;
  poster_url: string | null;
  sort_order: number;
  status: ContentStatus;
}

export interface CinematicSection {
  quote: string;
  attribution: string;
  image_url: string | null;
  toast_message: string;
}

export interface SiteContent {
  collections: CollectionItem[];
  lookbook: LookbookItem[];
  products: ProductItem[];
  community: CommunityItem[];
  collaborators: CollaboratorItem[];
  editorial: EditorialItem[];
  cinematic: CinematicSection | null;
  cinematicVideos: CinematicVideo[];
}
