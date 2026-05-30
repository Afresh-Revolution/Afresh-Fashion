"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  formatNaira,
  productBadgeLabel,
  resolveImage,
  useSiteContent,
} from "@/hooks/useSiteContent";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Clock,
  Gift,
  Globe,
  Instagram,
  Lock,
  Mail,
  MapPin,
  Music,
  Play,
  Search,
  ShoppingBag,
  Sparkles,
  Twitter,
  Youtube,
} from "lucide-react";
import FashionMenuToggle from "@/components/FashionMenuToggle";
import ProductImageCarousel from "@/components/ProductImageCarousel";
import styles from "@/styles/home.module.scss";
import { useAfreshSite } from "@/hooks/useAfreshSite";
import { useCart } from "@/hooks/useCart";
import CheckoutDrawer from "@/components/CheckoutDrawer";
import SearchOverlay from "@/components/SearchOverlay";
import HeroSection from "@/components/HeroSection";
import HelpPageModal from "@/components/HelpPageModal";
import { footerLabelToHelpSlug, isHelpFooterGroup } from "@/lib/help-pages";
import type { HelpPage } from "@/types/content";

const PERK_ICONS: Record<string, LucideIcon> = {
  clock: Clock,
  lock: Lock,
  sparkles: Sparkles,
  gift: Gift,
};

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  music: Music,
};

function Marquee({ items, reverse }: { items: string[]; reverse?: boolean }) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];
  return (
    <div className={styles.marquee}>
      <div
        className={`marquee-track ${reverse ? "marquee-track--reverse" : ""}`}
      >
        {doubled.map((text, i) => (
          <span key={i}>
            <span className={styles.marqueeItem}>{text}</span>
            <span className={styles.marqueeDot}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: (id: string) => void;
}) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick(href);
      }}
    >
      {children}
    </a>
  );
}

export default function AfreshPage() {
  const { content } = useSiteContent();
  const site = useAfreshSite(content.drop?.drop_at ?? null);
  const cart = useCart(site.showToast);
  const currency = content.settings?.currency_symbol ?? "₦";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoIndex, setVideoIndex] = useState(0);
  const [filmOpen, setFilmOpen] = useState(false);
  const [helpPage, setHelpPage] = useState<HelpPage | null>(null);

  const helpBySlug = Object.fromEntries(content.helpPages.map((p) => [p.slug, p]));
  const publicContactEmail =
    helpBySlug["contact-us"]?.contact_email?.trim() ||
    content.contact?.email?.trim() ||
    "info@afreshfashion.com";

  const openHelp = (label: string) => {
    const slug = footerLabelToHelpSlug(label);
    if (!slug) return;
    const page = helpBySlug[slug];
    if (page) setHelpPage(page);
  };

  const cinematic = content.cinematic;
  const videos = content.cinematicVideos.filter(
    (v): v is (typeof v & { video_url: string }) => Boolean(v.video_url),
  );
  const featuredEditorial = content.editorial.filter(
    (a) => a.layout === "featured",
  );
  const cardEditorial = content.editorial.filter((a) => a.layout === "card");
  const miniEditorial = content.editorial.filter((a) => a.layout === "mini");
  const primaryMarquee = content.marquees.find((m) => m.slug === "primary");
  const secondaryMarquee = content.marquees.find((m) => m.slug === "secondary");
  const shopFilters = [
    { slug: "all", name: "All" },
    ...content.productCategories.map((c) => ({ slug: c.slug, name: c.name })),
  ];

  const playFilm = () => {
    if (videos.length === 0) {
      site.showToast(cinematic?.toast_message ?? "");
      return;
    }
    setFilmOpen(true);
    requestAnimationFrame(() => videoRef.current?.play().catch(() => {}));
  };

  const nextFilm = () => {
    if (videos.length <= 1) return;
    const next = (videoIndex + 1) % videos.length;
    setVideoIndex(next);
    if (videoRef.current) {
      videoRef.current.src = videos[next].video_url;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <>
      <div id="preloader">
        <div className="preloader-wordmark">
          <div className="preloader-brand" aria-hidden="true">
            {"AFRESH".split("").map((letter, i) => (
              <span key={i}>{letter}</span>
            ))}
          </div>
          <span className="preloader-fashion">fashion</span>
        </div>
        <div className="preloader-line" />
      </div>

      <div className="cursor-dot" id="cursorDot" />
      <div className="cursor-ring" id="cursorRing" />

      <div className={`toast ${site.toastVisible ? "show" : ""}`} id="toast">
        {site.toastMessage}
      </div>

      <nav
        id="navbar"
        className={`${styles.navbar} ${site.navSolid ? "nav-solid" : ""}`}
      >
        <div className={styles.navInner}>
          <NavLink href="#hero" onClick={site.scrollTo}>
            <span className={styles.logoLink}>
              <Logo size="md" priority />
            </span>
          </NavLink>
          <div className={styles.navLinks}>
            <NavLink href="#collections" onClick={site.scrollTo}>
              Collections
            </NavLink>
            <NavLink href="#lookbook" onClick={site.scrollTo}>
              Lookbook
            </NavLink>
            <NavLink href="#shop" onClick={site.scrollTo}>
              Shop
            </NavLink>
            <NavLink href="#editorial" onClick={site.scrollTo}>
              Editorial
            </NavLink>
            <NavLink href="#community" onClick={site.scrollTo}>
              Community
            </NavLink>
            <NavLink href="#about" onClick={site.scrollTo}>
              About
            </NavLink>
          </div>
          <div className={styles.navActions}>
            <button
              type="button"
              className={styles.iconBtn}
              id="searchBtn"
              onClick={() => cart.setSearchOpen(true)}
              aria-label="Search"
            >
              <Search size={18} />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              id="cartBtn"
              onClick={() => cart.openCheckout()}
              aria-label="Cart"
            >
              <ShoppingBag size={18} />
              <span className={styles.cartBadge}>{cart.cartCount}</span>
            </button>
            <NavLink href="#membership" onClick={site.scrollTo}>
              <span className={styles.vipBtn}>Join VIP</span>
            </NavLink>
          </div>
          <div className={styles.navMobileBar}>
            <div className={styles.navMobileIcons}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => cart.setSearchOpen(true)}
                aria-label="Search"
              >
                <Search size={18} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                id="cartBtnMobile"
                onClick={() => cart.openCheckout()}
                aria-label="Cart"
              >
                <ShoppingBag size={18} />
                <span className={styles.cartBadge}>{cart.cartCount}</span>
              </button>
            </div>
            <FashionMenuToggle open={site.menuOpen} onClick={site.toggleMenu} />
          </div>
        </div>
      </nav>

      <div
        className={`mobile-menu ${site.menuOpen ? "open" : ""} ${styles.mobileMenu}`}
        id="mobileMenu"
        aria-hidden={!site.menuOpen}
      >
        <div className={styles.mobileMenuInner}>
          <p className={styles.mobileMenuLabel}>Navigate</p>
          {[
            "#collections",
            "#lookbook",
            "#shop",
            "#editorial",
            "#community",
            "#about",
          ].map((href, i) => (
            <a
              key={href}
              href={href}
              className={styles.mobileMenuLink}
              style={{ transitionDelay: site.menuOpen ? `${i * 0.05}s` : "0s" }}
              onClick={(e) => {
                e.preventDefault();
                site.scrollTo(href);
              }}
            >
              <span className={styles.mobileMenuIndex}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {href.slice(1).toUpperCase()}
            </a>
          ))}
          <a
            href="#membership"
            className={styles.mobileVip}
            onClick={(e) => {
              e.preventDefault();
              site.scrollTo("#membership");
            }}
          >
            Join VIP
          </a>
        </div>
      </div>

      {content.hero && (
        <HeroSection hero={content.hero} onNavigate={site.scrollTo} />
      )}

      {primaryMarquee && <Marquee items={primaryMarquee.items} />}

      {content.about && (
        <section
          id="about"
          className={`${styles.section} ${styles.bgMatte} ${styles.aboutSection}`}
        >
          <div className={styles.aboutGlow} />
          <div className={styles.container}>
            <div className={styles.aboutGrid}>
              <div className={styles.aboutCol}>
                <p className="reveal label">{content.about.section_label}</p>
                <h2 className="reveal section-heading">
                  {content.about.heading_line_1}
                  <br />
                  {content.about.heading_line_2}
                </h2>
                <div className={`${styles.goldLine} reveal`} />
              </div>
              <div className={`${styles.aboutCol} ${styles.textStack}`}>
                <p className={`${styles.editorialLead} reveal`}>
                  {content.about.lead_paragraph}
                </p>
                <p className={`${styles.bodyText} reveal`}>
                  {content.about.body_paragraph_1}
                </p>
                <p className={`${styles.bodyText} reveal`}>
                  {content.about.body_paragraph_2}
                </p>
                <a
                  href={content.about.cta_href}
                  className={`${styles.linkArrow} reveal`}
                  onClick={(e) => {
                    e.preventDefault();
                    site.scrollTo(content.about!.cta_href);
                  }}
                >
                  <span>{content.about.cta_label}</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
            {content.aboutStats.length > 0 && (
              <div className={styles.statsGrid}>
                {content.aboutStats.map((s) => (
                  <div key={s.id} className="reveal">
                    {s.is_symbolic ? (
                      <p className={styles.statNumber}>{s.symbol_text}</p>
                    ) : (
                      <p
                        className={`${styles.statNumber} counter`}
                        data-target={s.value_numeric ?? 0}
                      >
                        0
                      </p>
                    )}
                    <p className={styles.statLabel}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {(content.collectionsSection || content.collections.length > 0) && (
        <section
          id="collections"
          className={`${styles.section} ${styles.bgGraphite}`}
        >
          <div className={styles.container}>
            {content.collectionsSection && (
              <div className={styles.sectionHeader}>
                <div>
                  <p className="reveal label">
                    {content.collectionsSection.section_label}
                  </p>
                  <h2 className="reveal section-heading">
                    {content.collectionsSection.heading}
                  </h2>
                </div>
                {content.collectionsSection.view_all_label && (
                  <a
                    href={content.collectionsSection.view_all_href || "#shop"}
                    className={`${styles.linkArrow} reveal`}
                    onClick={(e) => {
                      e.preventDefault();
                      site.scrollTo(
                        content.collectionsSection!.view_all_href || "#shop",
                      );
                    }}
                  >
                    <span>{content.collectionsSection.view_all_label}</span>
                    <ArrowRight size={14} />
                  </a>
                )}
              </div>
            )}
            <div className={styles.collectionsGrid}>
              {content.collections.map((c) => (
                <div
                  key={c.id}
                  className={`img-zoom reveal-scale ${styles.collectionCard}`}
                >
                  <img
                    src={resolveImage(c.slug || c.id, c.image_url, 600, 800)}
                    alt={c.title}
                  />
                  <div className={styles.collectionOverlay} />
                  <div className={styles.collectionContent}>
                    <p className={styles.collectionChapter}>{c.chapter}</p>
                    <h3 className={styles.collectionTitle}>{c.title}</h3>
                    <p className={styles.collectionDesc}>{c.description}</p>
                    <div className={styles.collectionExplore}>
                      <span>Explore</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {(content.lookbookSection || content.lookbook.length > 0) && (
        <section
          id="lookbook"
          className={`${styles.sectionSm} ${styles.bgMatte}`}
          style={{ overflow: "hidden" }}
        >
          {content.lookbookSection && (
            <div className={styles.lookbookHeader}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className="reveal label">
                    {content.lookbookSection.section_label}
                  </p>
                  <h2 className="reveal section-heading">
                    {content.lookbookSection.heading}
                  </h2>
                </div>
                {content.lookbookSection.description && (
                  <p
                    className={`${styles.bodyText} reveal`}
                    style={{ maxWidth: "24rem" }}
                  >
                    {content.lookbookSection.description}
                  </p>
                )}
              </div>
            </div>
          )}
          <div
            className={`lookbook-scroll ${styles.lookbookTrack}`}
            id="lookbookScroll"
          >
            {content.lookbook.map((l) => (
              <div key={l.id} className={styles.lookItem}>
                <div className={styles.lookImageWrap}>
                  <img
                    src={resolveImage(l.id, l.image_url, 360, 480)}
                    alt={l.label}
                  />
                  <span className={styles.lookLabel}>{l.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(cinematic || videos.length > 0) && (
        <section className={styles.cinematic}>
          {filmOpen && videos[videoIndex] ? (
            <video
              ref={videoRef}
              className={styles.cinematicVideo}
              src={videos[videoIndex].video_url}
              poster={videos[videoIndex].poster_url || undefined}
              playsInline
              controls
              onEnded={nextFilm}
            />
          ) : (
            <img
              src={resolveImage(
                "afresh-cinematic",
                cinematic?.image_url ?? videos[0]?.poster_url,
                1920,
                900,
              )}
              alt="Cinematic Break"
            />
          )}
          {cinematic && (
            <div className={styles.cinematicOverlay}>
              <div>
                <p className={`${styles.cinematicQuote} reveal`}>
                  &quot;{cinematic.quote}&quot;
                </p>
                <p className={`${styles.cinematicAttrib} reveal`}>
                  {cinematic.attribution}
                </p>
              </div>
            </div>
          )}
          <button
            type="button"
            className={`play-btn ${styles.playBtn}`}
            onClick={playFilm}
            aria-label="Play film"
          >
            <Play size={24} style={{ marginLeft: 4 }} />
          </button>
          {filmOpen && videos.length > 1 && (
            <button
              type="button"
              className={styles.filmNextBtn}
              onClick={nextFilm}
            >
              Next film
            </button>
          )}
        </section>
      )}

      {(content.shopSection || content.products.length > 0) && (
        <section id="shop" className={`${styles.section} ${styles.bgMatte}`}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              {content.shopSection && (
                <div>
                  <p className="reveal label">
                    {content.shopSection.section_label}
                  </p>
                  <h2 className="reveal section-heading">
                    {content.shopSection.heading}
                  </h2>
                </div>
              )}
              {shopFilters.length > 1 && (
                <div className={`${styles.shopFilters} reveal`}>
                  {shopFilters.map((f) => (
                    <button
                      key={f.slug}
                      type="button"
                      className={`shop-filter shop-filter-btn ${site.activeFilter === f.slug ? "active" : ""} ${styles.shopFilter}`}
                      onClick={() => site.setActiveFilter(f.slug)}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.productsGrid} id="shopGrid">
              {content.products.map((p) => {
                const badge = productBadgeLabel(p.badge);
                return (
                  <div
                    key={p.id}
                    className="product-card reveal"
                    data-category={p.category_slug}
                  >
                    <div className={styles.productImageWrap}>
                      <ProductImageCarousel
                        productId={p.id}
                        slug={p.slug}
                        name={p.name}
                        imageUrl={p.image_url}
                        imageUrls={p.image_urls}
                        resolveSrc={resolveImage}
                      />
                      <div
                        className={`product-overlay ${styles.productOverlay}`}
                      >
                        <button
                          type="button"
                          className={styles.addToBagBtn}
                          onClick={() => void cart.addToCart(p.id, p.name)}
                        >
                          Add to Bag
                        </button>
                      </div>
                      {badge === "New" && (
                        <span className={styles.productBadge}>{badge}</span>
                      )}
                      {badge === "Limited" && (
                        <span className={styles.productBadgeOutline}>
                          {badge}
                        </span>
                      )}
                    </div>
                    <div className={styles.productInfo}>
                      <h4>{p.name}</h4>
                      <p>{formatNaira(p.price_amount, currency)}</p>
                      <div className={styles.colorSwatches}>
                        {p.swatches.map((color) => (
                          <span
                            key={color}
                            className={styles.swatch}
                            style={{
                              background: color,
                              border: `1px solid ${color === "#0A0A0A" ? "#1E1E1E" : "rgba(191,192,192,0.2)"}`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {content.shopSection?.view_all_label && (
              <div className={`${styles.centerCta} reveal`}>
                <a
                  href={content.shopSection.view_all_href || "#"}
                  className={styles.btnOutlineLarge}
                  onClick={(e) => {
                    e.preventDefault();
                    if (content.shopSection?.view_all_href?.startsWith("#")) {
                      site.scrollTo(content.shopSection.view_all_href);
                    }
                  }}
                >
                  <span>{content.shopSection.view_all_label}</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {secondaryMarquee && <Marquee items={secondaryMarquee.items} reverse />}

      {content.drop && (
        <section
          id="drops"
          className={`${styles.section} ${styles.bgGraphite} ${styles.drops}`}
        >
          <div className={styles.dropsBg}>
            <img
              src={resolveImage(
                "afresh-drop-bg",
                content.drop.background_url,
                1920,
                1080,
              )}
              alt=""
            />
          </div>
          <div className={styles.dropsContent}>
            <div className={styles.dropsHeader}>
              <p className="reveal label">{content.drop.section_label}</p>
              <h2 className={`reveal ${styles.dropsTitle}`}>
                {content.drop.heading}
              </h2>
              <p className={`${styles.dropsSubtitle} reveal`}>
                {content.drop.subtitle}
              </p>
            </div>
            <div className={`${styles.countdown} reveal`}>
              {(["days", "hours", "minutes", "seconds"] as const).map(
                (unit) => (
                  <div key={unit} className={styles.countdownBox}>
                    <p id={unit}>{site.countdown[unit]}</p>
                    <p>
                      {unit === "minutes"
                        ? "Min"
                        : unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </p>
                  </div>
                ),
              )}
            </div>
            <div className={`${styles.dropsCtas} reveal`}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => site.showToast(content.drop!.cta_primary_label)}
              >
                {content.drop.cta_primary_label}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() =>
                  site.showToast(content.drop!.cta_secondary_label)
                }
              >
                {content.drop.cta_secondary_label}
              </button>
            </div>
            <p className={`${styles.dropsNote} reveal`}>
              {content.drop.footnote}
            </p>
          </div>
        </section>
      )}

      {(content.communitySection || content.community.length > 0) && (
        <section
          id="community"
          className={`${styles.section} ${styles.bgMatte}`}
        >
          <div className={styles.container}>
            {content.communitySection && (
              <div className={styles.sectionHeader}>
                <div>
                  <p className="reveal label">
                    {content.communitySection.section_label}
                  </p>
                  <h2 className="reveal section-heading">
                    {content.communitySection.heading}
                  </h2>
                </div>
                {content.communitySection.description && (
                  <p
                    className={`${styles.bodyText} reveal`}
                    style={{ maxWidth: "28rem" }}
                  >
                    {content.communitySection.description}
                  </p>
                )}
              </div>
            )}
            <div className={styles.communityGrid}>
              {content.community.map((c) => (
                <div
                  key={c.id}
                  className={`reveal-scale ${styles.communityItem} ${c.is_large_tile ? styles.communityFeatured : ""}`}
                >
                  <img
                    src={resolveImage(
                      c.id,
                      c.image_url,
                      c.is_large_tile ? 800 : 400,
                      c.is_large_tile ? 800 : 400,
                    )}
                    alt="Community"
                  />
                  <div className={styles.communityHandle}>
                    <p>{c.handle}</p>
                    {c.is_featured && <p className="featured">Featured</p>}
                  </div>
                </div>
              ))}
            </div>
            {content.collaborators.length > 0 && (
              <div className={styles.collaborators}>
                <div className={`${styles.collabGrid} reveal`}>
                  {content.collaborators.map((c) => (
                    <div
                      key={c.id}
                      className={`${styles.collabItem} ${c.is_wide_tile ? styles.collabSpan2 : ""}`}
                    >
                      <div className={styles.collabAvatar}>
                        <img
                          src={resolveImage(c.id, c.avatar_url, 100, 100)}
                          alt={c.name}
                        />
                      </div>
                      <p>{c.name}</p>
                      <p>{c.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {(content.editorialSection || content.editorial.length > 0) && (
        <section
          id="editorial"
          className={`${styles.section} ${styles.bgGraphite}`}
        >
          <div className={styles.container}>
            {content.editorialSection && (
              <div className={styles.sectionHeader}>
                <div>
                  <p className="reveal label">
                    {content.editorialSection.section_label}
                  </p>
                  <h2 className="reveal section-heading">
                    {content.editorialSection.heading}
                  </h2>
                </div>
                {content.editorialSection.read_all_label && (
                  <a
                    href={content.editorialSection.read_all_href || "#"}
                    className={`${styles.linkArrow} reveal`}
                  >
                    <span>{content.editorialSection.read_all_label}</span>
                    <ArrowRight size={14} />
                  </a>
                )}
              </div>
            )}
            <div className={styles.editorialGrid}>
              {featuredEditorial[0] && (
                <div className={`reveal ${styles.editorialFeatured}`}>
                  <div
                    className={`${styles.articleCard} ${styles.articleFeaturedWrap}`}
                  >
                    <img
                      src={resolveImage(
                        featuredEditorial[0].id,
                        featuredEditorial[0].image_url,
                        800,
                        500,
                      )}
                      alt="Editorial"
                    />
                    <div className={styles.articleOverlay} />
                    <div className={styles.articleContent}>
                      <div className={styles.articleTags}>
                        <span className={styles.articleTagOutline}>
                          {featuredEditorial[0].tag}
                        </span>
                        {featuredEditorial[0].meta_text && (
                          <span className={styles.articleMeta}>
                            {featuredEditorial[0].meta_text}
                          </span>
                        )}
                      </div>
                      <h3
                        className={`${styles.articleTitle} ${styles.articleTitleLg}`}
                      >
                        {featuredEditorial[0].title}
                      </h3>
                      {featuredEditorial[0].excerpt && (
                        <p className={styles.articleExcerpt}>
                          {featuredEditorial[0].excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {cardEditorial.map((a) => (
                <div key={a.id} className="reveal">
                  <div
                    className={`${styles.articleCard} ${styles.articleSmallWrap}`}
                  >
                    <img
                      src={resolveImage(a.id, a.image_url, 400, 300)}
                      alt="Editorial"
                    />
                    <div className={styles.articleOverlay} />
                    <div className={styles.articleContent}>
                      <span className={styles.articleTag}>{a.tag}</span>
                      <h4
                        className={`${styles.articleTitle} ${styles.articleTitleSm}`}
                      >
                        {a.title}
                      </h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.moreArticles}>
              {miniEditorial.map((a) => (
                <div key={a.id} className={`${styles.miniArticle} reveal`}>
                  <img src={resolveImage(a.id, a.image_url, 100, 100)} alt="" />
                  <div>
                    <span className={styles.articleTag}>{a.tag}</span>
                    <h4>{a.title}</h4>
                    {a.meta_text && <p>{a.meta_text}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {content.membership && (
        <section
          id="membership"
          className={`${styles.section} ${styles.bgMatte} ${styles.membership}`}
        >
          <div className={styles.membershipBg}>
            <img
              src={resolveImage(
                "afresh-member",
                content.membership.background_url,
                1920,
                1080,
              )}
              alt=""
            />
          </div>
          <div className={styles.membershipGradient} />
          <div className={styles.membershipInner}>
            <p className="reveal label">{content.membership.section_label}</p>
            <h2 className="reveal section-heading">
              <span>{content.membership.heading_line_1}</span>
              <br />
              <span
                className={
                  content.membership.heading_line_2_gold ? "gold-text" : ""
                }
              >
                {content.membership.heading_line_2}
              </span>
            </h2>
            <p
              className={`${styles.editorialLead} reveal`}
              style={{ marginTop: "1.5rem" }}
            >
              {content.membership.description}
            </p>
            {content.membershipPerks.length > 0 && (
              <div className={`${styles.perksGrid} reveal`}>
                {content.membershipPerks.map((perk) => {
                  const Icon = PERK_ICONS[perk.icon_key] ?? Sparkles;
                  return (
                    <div key={perk.title} className={styles.perkCard}>
                      <Icon size={18} />
                      <h4>{perk.title}</h4>
                      <p>{perk.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
            <div className={`${styles.signupRow} reveal`}>
              <input
                type="email"
                placeholder={content.membership.signup_placeholder}
                id="memberEmail"
                value={site.memberEmail}
                onChange={(e) => site.setMemberEmail(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={site.joinVIP}
              >
                {content.membership.signup_button_label}
              </button>
            </div>
            <p className={`${styles.signupNote} reveal`}>
              {content.membership.footnote}
            </p>
          </div>
        </section>
      )}

      {content.contact && (
        <section
          id="contact"
          className={`${styles.section} ${styles.bgGraphite}`}
        >
          <div className={styles.container}>
            <div className={styles.contactGrid}>
              <div>
                <p className="reveal label">{content.contact.section_label}</p>
                <h2 className="reveal section-heading">
                  {content.contact.heading}
                </h2>
                <div className={`${styles.goldLine} reveal`} />
                <p
                  className={`${styles.bodyText} reveal`}
                  style={{ margin: "2rem 0" }}
                >
                  {content.contact.intro_text}
                </p>
                <div className={`${styles.contactInfo} reveal`}>
                  <div>
                    <Mail size={16} />
                    <a href={`mailto:${publicContactEmail}`}>{publicContactEmail}</a>
                  </div>
                  <div>
                    <MapPin size={16} />
                    <span>{content.contact.location}</span>
                  </div>
                  <div>
                    <Globe size={16} />
                    <span>{content.contact.shipping_note}</span>
                  </div>
                </div>
              </div>
              <form
                className={styles.contactForm}
                id="contactForm"
                onSubmit={site.submitContact}
              >
                {["Name", "Email"].map((field) => (
                  <div key={field} className={`${styles.formField} reveal`}>
                    <label>{field}</label>
                    <input
                      type={field === "Email" ? "email" : "text"}
                      required
                      placeholder={
                        field === "Name" ? "Your name" : "your@email.com"
                      }
                    />
                  </div>
                ))}
                <div className={`${styles.formField} reveal`}>
                  <label>Subject</label>
                  <select defaultValue="">
                    <option value="">Select inquiry type</option>
                    <option value="press">Press</option>
                    <option value="collab">Collaboration</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="support">Customer Support</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className={`${styles.formField} reveal`}>
                  <label>Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us what's on your mind"
                  />
                </div>
                <div className="reveal">
                  <button type="submit" className="btn-primary">
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      )}

      {content.footer && (
        <footer className={styles.footer}>
          <div className={styles.container}>
            <div className={styles.footerGrid}>
              <div className={styles.footerBrand}>
                <a
                  href="#hero"
                  className={styles.logoLink}
                  onClick={(e) => {
                    e.preventDefault();
                    site.scrollTo("#hero");
                  }}
                >
                  <Logo size="lg" />
                </a>
                <p>{content.footer.tagline}</p>
                {content.footer.social.length > 0 && (
                  <div className={styles.socialLinks}>
                    {content.footer.social.map((s) => {
                      const Icon =
                        SOCIAL_ICONS[s.icon_key] ??
                        SOCIAL_ICONS[s.platform] ??
                        Globe;
                      return (
                        <a
                          key={s.platform}
                          href={s.url}
                          aria-label={s.platform}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Icon size={18} />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
              {content.footer.link_groups.map((col) => (
                <div key={col.title} className={styles.footerCol}>
                  <h5>{col.title}</h5>
                  {col.links.map((l) => {
                    const helpSlug = isHelpFooterGroup(col.title)
                      ? footerLabelToHelpSlug(l.label)
                      : null;
                    if (helpSlug && helpBySlug[helpSlug]) {
                      return (
                        <button
                          key={l.label}
                          type="button"
                          className={styles.footerLinkBtn}
                          onClick={() => openHelp(l.label)}
                        >
                          {l.label}
                        </button>
                      );
                    }
                    const href = l.href.startsWith("#")
                      ? l.href
                      : l.href === "#"
                        ? "#contact"
                        : l.href;
                    return (
                      <a
                        key={l.label}
                        href={href}
                        onClick={(e) => {
                          if (href.startsWith("#")) {
                            e.preventDefault();
                            site.scrollTo(href);
                          }
                        }}
                      >
                        {l.label}
                      </a>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="section-divider" style={{ marginBottom: "2rem" }} />
            <div className={styles.footerBottom}>
              <p>
                {content.footer.copyright_text}
                <Link href="/admin" className={styles.footerStealth}>
                  {content.footer.stealth_ref}
                </Link>
              </p>
              <p>{content.footer.cities_line}</p>
            </div>
          </div>
        </footer>
      )}

      <SearchOverlay
        open={cart.searchOpen}
        onClose={() => cart.setSearchOpen(false)}
        currency={currency}
        onSelect={() => site.scrollTo("#shop")}
      />
      <CheckoutDrawer
        cart={cart}
        currency={currency}
        showToast={site.showToast}
        onShopMore={() => site.scrollTo("#shop")}
      />
      <HelpPageModal page={helpPage} onClose={() => setHelpPage(null)} />
    </>
  );
}
