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
  image_urls: string[];
  sort_order: number;
  status: ContentStatus;
  swatches: string[];
}

export interface ProductCategory {
  slug: string;
  name: string;
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

export interface HeroSection extends Record<string, unknown> {
  background_url: string | null;
  background_urls: string[];
  tagline: string;
  title: string;
  subtitle: string;
  cta_primary_label: string;
  cta_primary_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
  side_label: string;
  scroll_label: string;
}

export interface AboutSection {
  section_label: string;
  heading_line_1: string;
  heading_line_2: string;
  lead_paragraph: string;
  body_paragraph_1: string;
  body_paragraph_2: string;
  cta_label: string;
  cta_href: string;
}

export interface AboutStat {
  id: string;
  value_numeric: number | null;
  is_symbolic: boolean;
  symbol_text: string | null;
  label: string;
}

export interface SectionHeader {
  section_label: string;
  heading: string;
  view_all_label?: string;
  view_all_href?: string;
  description?: string;
  read_all_label?: string;
  read_all_href?: string;
  instagram_handle?: string;
}

export interface MarqueeBand {
  slug: string;
  direction: "forward" | "reverse";
  items: string[];
}

export interface DropSection {
  section_label: string;
  heading: string;
  title: string;
  subtitle: string;
  pieces_worldwide: number;
  drop_at: string;
  background_url: string | null;
  cta_primary_label: string;
  cta_secondary_label: string;
  footnote: string;
}

export interface MembershipSection {
  section_label: string;
  heading_line_1: string;
  heading_line_2: string;
  heading_line_2_gold: boolean;
  description: string;
  signup_placeholder: string;
  signup_button_label: string;
  footnote: string;
  background_url: string | null;
}

export interface MembershipPerk {
  icon_key: string;
  title: string;
  description: string;
}

export interface ContactSection {
  section_label: string;
  heading: string;
  intro_text: string;
  email: string;
  location: string;
  shipping_note: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  platform: string;
  url: string;
  icon_key: string;
}

export interface FooterContent {
  tagline: string;
  copyright_text: string;
  cities_line: string;
  stealth_ref: string;
  link_groups: FooterLinkGroup[];
  social: SocialLink[];
}

export interface HelpPage {
  slug: string;
  title: string;
  body: string;
  diagram_url: string | null;
  diagram_caption: string | null;
  contact_email: string | null;
}

export interface SiteSettings {
  brand_name: string;
  season_label: string;
  currency_symbol: string;
}

export interface SiteContent {
  settings: SiteSettings | null;
  hero: HeroSection | null;
  about: AboutSection | null;
  aboutStats: AboutStat[];
  marquees: MarqueeBand[];
  collectionsSection: SectionHeader | null;
  collections: CollectionItem[];
  lookbookSection: SectionHeader | null;
  lookbook: LookbookItem[];
  shopSection: SectionHeader | null;
  productCategories: ProductCategory[];
  products: ProductItem[];
  drop: DropSection | null;
  communitySection: SectionHeader | null;
  community: CommunityItem[];
  collaborators: CollaboratorItem[];
  editorialSection: SectionHeader | null;
  editorial: EditorialItem[];
  membership: MembershipSection | null;
  membershipPerks: MembershipPerk[];
  contact: ContactSection | null;
  footer: FooterContent | null;
  helpPages: HelpPage[];
  cinematic: CinematicSection | null;
  cinematicVideos: CinematicVideo[];
}
