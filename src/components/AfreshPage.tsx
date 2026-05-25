"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { formatNaira, productBadgeLabel, useSiteContent } from "@/hooks/useSiteContent";
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Gift,
  Globe,
  Instagram,
  Lock,
  Mail,
  MapPin,
  Menu,
  Music,
  Play,
  Search,
  ShoppingBag,
  Sparkles,
  Twitter,
  X,
  Youtube,
} from "lucide-react";
import styles from "@/styles/home.module.scss";
import { useAfreshSite } from "@/hooks/useAfreshSite";

const MARQUEE_1 = [
  "AFRESH",
  "GLOBAL FASHION MOVEMENT",
  "BORN FROM AFRICA",
  "IDENTITY IS EVERYTHING",
];
const MARQUEE_2 = [
  "FASHION IS ARMOR",
  "STYLE IS LANGUAGE",
  "CULTURE IS CURRENCY",
  "IDENTITY IS EVERYTHING",
];

function imgOr(seed: string, url: string | null | undefined, w: number, h: number) {
  return url || `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

function Marquee({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className={styles.marquee}>
      <div className={`marquee-track ${reverse ? "marquee-track--reverse" : ""}`}>
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

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: (id: string) => void }) {
  return (
    <a href={href} onClick={(e) => { e.preventDefault(); onClick(href); }}>
      {children}
    </a>
  );
}

export default function AfreshPage() {
  const site = useAfreshSite();
  const { content } = useSiteContent();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoIndex, setVideoIndex] = useState(0);
  const [filmOpen, setFilmOpen] = useState(false);

  const cinematic = content.cinematic;
  const videos = content.cinematicVideos;
  const featuredEditorial = content.editorial.filter((a) => a.layout === "featured");
  const cardEditorial = content.editorial.filter((a) => a.layout === "card");
  const miniEditorial = content.editorial.filter((a) => a.layout === "mini");

  const playFilm = () => {
    if (videos.length === 0) {
      site.showToast(cinematic?.toast_message || "Fashion film coming soon");
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

      <nav id="navbar" className={`${styles.navbar} ${site.navSolid ? "nav-solid" : ""}`}>
        <div className={styles.navInner}>
          <NavLink href="#hero" onClick={site.scrollTo}>
            <span className={styles.logoLink}><Logo size="md" priority /></span>
          </NavLink>
          <div className={styles.navLinks}>
            <NavLink href="#collections" onClick={site.scrollTo}>Collections</NavLink>
            <NavLink href="#lookbook" onClick={site.scrollTo}>Lookbook</NavLink>
            <NavLink href="#shop" onClick={site.scrollTo}>Shop</NavLink>
            <NavLink href="#editorial" onClick={site.scrollTo}>Editorial</NavLink>
            <NavLink href="#community" onClick={site.scrollTo}>Community</NavLink>
            <NavLink href="#about" onClick={site.scrollTo}>About</NavLink>
          </div>
          <div className={styles.navActions}>
            <button type="button" className={styles.iconBtn} id="searchBtn" onClick={() => site.showToast("Search coming soon")} aria-label="Search">
              <Search size={18} />
            </button>
            <button type="button" className={styles.iconBtn} id="cartBtn" onClick={() => site.showToast(`Your bag has ${site.cartCount} item${site.cartCount !== 1 ? "s" : ""}`)} aria-label="Cart">
              <ShoppingBag size={18} />
              <span className={styles.cartBadge}>{site.cartCount}</span>
            </button>
            <NavLink href="#membership" onClick={site.scrollTo}><span className={styles.vipBtn}>Join VIP</span></NavLink>
          </div>
          <button type="button" className={styles.menuToggle} onClick={site.toggleMenu} aria-label="Menu">
            {site.menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${site.menuOpen ? "open" : ""} ${styles.mobileMenu}`} id="mobileMenu">
        {["#collections", "#lookbook", "#shop", "#editorial", "#community", "#about"].map((href) => (
          <a key={href} href={href} onClick={(e) => { e.preventDefault(); site.scrollTo(href); }}>
            {href.slice(1).toUpperCase()}
          </a>
        ))}
        <a href="#membership" className={styles.mobileVip} onClick={(e) => { e.preventDefault(); site.scrollTo("#membership"); }}>Join VIP</a>
      </div>

      <section id="hero" className={styles.hero}>
        <div className={styles.heroImageWrap}>
          <img src="https://picsum.photos/seed/afresh-hero-dark/1920/1080" alt="AFRESH Hero" className={`${styles.heroImage} hero-bg`} />
        </div>
        <div className={styles.heroOverlay1} />
        <div className={styles.heroOverlay2} />
        <div id="heroParticles" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        <div className={styles.heroContent} id="heroContent">
          <p className={`${styles.heroTagline} hero-fade`} style={{ opacity: 0 }}>Global Fashion Movement — Born From Africa</p>
          <h1 className={`${styles.heroTitle} hero-title`} style={{ opacity: 0 }}>AFRESH</h1>
          <p className={`${styles.heroSubtitle} hero-fade`} style={{ opacity: 0 }}>Where heritage meets the future. Fashion as identity, culture as currency.</p>
          <div className={`${styles.heroCtas} hero-fade`} style={{ opacity: 0 }}>
            <a href="#collections" className="btn-primary" onClick={(e) => { e.preventDefault(); site.scrollTo("#collections"); }}>Explore Collections</a>
            <a href="#lookbook" className="btn-outline" onClick={(e) => { e.preventDefault(); site.scrollTo("#lookbook"); }}>View Lookbook</a>
          </div>
        </div>
        <div className={`${styles.heroScroll} scroll-indicator`}>
          <span>Scroll</span>
          <ChevronDown size={16} style={{ color: "rgba(200,169,107,0.6)" }} />
        </div>
        <div className={styles.heroSide}>
          <div className={styles.heroSideLine} />
          <span>SS/25</span>
          <div className={styles.heroSideLine} />
        </div>
      </section>

      <Marquee items={MARQUEE_1} />

      <section id="about" className={`${styles.section} ${styles.bgMatte} ${styles.aboutSection}`}>
        <div className={styles.aboutGlow} />
        <div className={styles.container}>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutCol}>
              <p className="reveal label">Our Manifesto</p>
              <h2 className="reveal section-heading">WE DON&apos;T JUST<br />MAKE CLOTHES</h2>
              <div className={`${styles.goldLine} reveal`} />
            </div>
            <div className={`${styles.aboutCol} ${styles.textStack}`}>
              <p className={`${styles.editorialLead} reveal`}>Born from the pulse of African culture, forged in futuristic vision. Every thread tells a story. Every collection is a movement.</p>
              <p className={`${styles.bodyText} reveal`}>We are not a brand — we are a belief. That fashion is armor. That style is language. That culture is currency. People buy identity, emotion, belonging — not just clothes. AFRESH exists at the intersection of heritage and tomorrow, creating garments that carry the weight of culture and the speed of the future.</p>
              <p className={`${styles.bodyText} reveal`}>Our creative philosophy draws from the streets of Lagos, the energy of Accra, the innovation of Nairobi — filtered through a futuristic lens that speaks to the global youth. This is not a Nigerian clothing website. This is a global fashion movement born from Africa.</p>
              <a href="#membership" className={`${styles.linkArrow} reveal`} onClick={(e) => { e.preventDefault(); site.scrollTo("#membership"); }}>
                <span>Read Our Full Story</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
          <div className={styles.statsGrid}>
            {[{ t: 47, l: "Countries Reached" }, { t: 12, l: "Collections Dropped" }, { t: 25, l: "Global Collaborators" }].map((s) => (
              <div key={s.l} className="reveal">
                <p className={`${styles.statNumber} counter`} data-target={s.t}>0</p>
                <p className={styles.statLabel}>{s.l}</p>
              </div>
            ))}
            <div className="reveal">
              <p className={styles.statNumber}>∞</p>
              <p className={styles.statLabel}>Cultural Impact</p>
            </div>
          </div>
        </div>
      </section>

      <section id="collections" className={`${styles.section} ${styles.bgGraphite}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <p className="reveal label">SS/25</p>
              <h2 className="reveal section-heading">COLLECTIONS</h2>
            </div>
            <a href="#shop" className={`${styles.linkArrow} reveal`} onClick={(e) => { e.preventDefault(); site.scrollTo("#shop"); }}>
              <span>View All</span>
              <ArrowRight size={14} />
            </a>
          </div>
          <div className={styles.collectionsGrid}>
            {content.collections.map((c) => (
              <div key={c.id} className={`img-zoom reveal-scale ${styles.collectionCard}`}>
                <img src={imgOr(c.slug || c.id, c.image_url, 600, 800)} alt={c.title} />
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

      <section id="lookbook" className={`${styles.sectionSm} ${styles.bgMatte}`} style={{ overflow: "hidden" }}>
        <div className={styles.lookbookHeader}>
          <div className={styles.sectionHeader}>
            <div>
              <p className="reveal label">Editorial</p>
              <h2 className="reveal section-heading">LOOKBOOK</h2>
            </div>
            <p className={`${styles.bodyText} reveal`} style={{ maxWidth: "24rem" }}>Each frame is a chapter. Each outfit, a narrative. Scroll through our visual story — campaign by campaign.</p>
          </div>
        </div>
        <div className={`lookbook-scroll ${styles.lookbookTrack}`} id="lookbookScroll">
          {content.lookbook.map((l) => (
            <div key={l.id} className={styles.lookItem}>
              <div className={styles.lookImageWrap}>
                <img src={imgOr(l.id, l.image_url, 360, 480)} alt={l.label} />
                <span className={styles.lookLabel}>{l.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

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
            src={imgOr("afresh-cinematic", cinematic?.image_url ?? videos[0]?.poster_url, 1920, 900)}
            alt="Cinematic Break"
          />
        )}
        <div className={styles.cinematicOverlay}>
          <div>
            <p className={`${styles.cinematicQuote} reveal`}>
              &quot;{cinematic?.quote || "Fashion is not about clothes. It's about a vision of life."}&quot;
            </p>
            <p className={`${styles.cinematicAttrib} reveal`}>
              {cinematic?.attribution || "— The AFRESH Philosophy"}
            </p>
          </div>
        </div>
        <button type="button" className={`play-btn ${styles.playBtn}`} onClick={playFilm} aria-label="Play film">
          <Play size={24} style={{ marginLeft: 4 }} />
        </button>
        {filmOpen && videos.length > 1 && (
          <button type="button" className={styles.filmNextBtn} onClick={nextFilm}>
            Next film
          </button>
        )}
      </section>

      <section id="shop" className={`${styles.section} ${styles.bgMatte}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <p className="reveal label">Curated</p>
              <h2 className="reveal section-heading">THE SHOP</h2>
            </div>
            <div className={`${styles.shopFilters} reveal`}>
              {["all", "tops", "bottoms", "outerwear", "accessories"].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`shop-filter shop-filter-btn ${site.activeFilter === f ? "active" : ""} ${styles.shopFilter}`}
                  onClick={() => site.setActiveFilter(f)}
                >
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.productsGrid} id="shopGrid">
            {content.products.map((p) => {
              const badge = productBadgeLabel(p.badge);
              return (
                <div key={p.id} className="product-card reveal" data-category={p.category_slug}>
                  <div className={styles.productImageWrap}>
                    <img src={imgOr(p.slug, p.image_url, 400, 530)} alt={p.name} className="product-img" />
                    <div className={`product-overlay ${styles.productOverlay}`}>
                      <button type="button" className={styles.addToBagBtn} onClick={() => site.addToCart(p.name)}>
                        Add to Bag
                      </button>
                    </div>
                    {badge === "New" && <span className={styles.productBadge}>{badge}</span>}
                    {badge === "Limited" && <span className={styles.productBadgeOutline}>{badge}</span>}
                  </div>
                  <div className={styles.productInfo}>
                    <h4>{p.name}</h4>
                    <p>{formatNaira(p.price_amount)}</p>
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
          <div className={`${styles.centerCta} reveal`}>
            <a href="#" className={styles.btnOutlineLarge}>
              <span>View All Products</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      <Marquee items={MARQUEE_2} reverse />

      <section id="drops" className={`${styles.section} ${styles.bgGraphite} ${styles.drops}`}>
        <div className={styles.dropsBg}>
          <img src="https://picsum.photos/seed/afresh-drop-bg/1920/1080" alt="" />
        </div>
        <div className={styles.dropsContent}>
          <div className={styles.dropsHeader}>
            <p className="reveal label">Limited Edition</p>
            <h2 className={`reveal ${styles.dropsTitle}`}>NEXT DROP</h2>
            <p className={`${styles.dropsSubtitle} reveal`}>The &quot;Ancestral Code&quot; Capsule — 50 Pieces Worldwide</p>
          </div>
          <div className={`${styles.countdown} reveal`}>
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <div key={unit} className={styles.countdownBox}>
                <p id={unit}>{site.countdown[unit]}</p>
                <p>{unit === "minutes" ? "Min" : unit.charAt(0).toUpperCase() + unit.slice(1)}</p>
              </div>
            ))}
          </div>
          <div className={`${styles.dropsCtas} reveal`}>
            <button type="button" className="btn-primary" onClick={() => site.showToast("Early access registered — check your email")}>Get Early Access</button>
            <button type="button" className="btn-outline" onClick={() => site.showToast("VIP membership required for private collections")}>Unlock Private Collection</button>
          </div>
          <p className={`${styles.dropsNote} reveal`}>Invite-only • VIP members get 24hr early access</p>
        </div>
      </section>

      <section id="community" className={`${styles.section} ${styles.bgMatte}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <p className="reveal label">The Movement</p>
              <h2 className="reveal section-heading">COMMUNITY</h2>
            </div>
            <p className={`${styles.bodyText} reveal`} style={{ maxWidth: "28rem" }}>This is what separates brands from clothing companies. Our community wears the culture. Tag <span style={{ color: "#C8A96B" }}>@afresh</span> to be featured.</p>
          </div>
          <div className={styles.communityGrid}>
            {content.community.map((c) => (
              <div
                key={c.id}
                className={`reveal-scale ${styles.communityItem} ${c.is_large_tile ? styles.communityFeatured : ""}`}
              >
                <img
                  src={imgOr(c.id, c.image_url, c.is_large_tile ? 800 : 400, c.is_large_tile ? 800 : 400)}
                  alt="Community"
                />
                <div className={styles.communityHandle}>
                  <p>{c.handle}</p>
                  {c.is_featured && <p className="featured">Featured</p>}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.collaborators}>
            <p className={`${styles.collabLabel} reveal`}>Collaborators & Ambassadors</p>
            <div className={`${styles.collabGrid} reveal`}>
              {content.collaborators.map((c) => (
                <div key={c.id} className={`${styles.collabItem} ${c.is_wide_tile ? styles.collabSpan2 : ""}`}>
                  <div className={styles.collabAvatar}>
                    <img src={imgOr(c.id, c.avatar_url, 100, 100)} alt={c.name} />
                  </div>
                  <p>{c.name}</p>
                  <p>{c.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="editorial" className={`${styles.section} ${styles.bgGraphite}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <p className="reveal label">Fashion Media</p>
              <h2 className="reveal section-heading">EDITORIAL</h2>
            </div>
            <a href="#" className={`${styles.linkArrow} reveal`}>
              <span>Read All</span>
              <ArrowRight size={14} />
            </a>
          </div>
          <div className={styles.editorialGrid}>
            {featuredEditorial[0] && (
              <div className={`reveal ${styles.editorialFeatured}`}>
                <div className={`${styles.articleCard} ${styles.articleFeaturedWrap}`}>
                  <img src={imgOr(featuredEditorial[0].id, featuredEditorial[0].image_url, 800, 500)} alt="Editorial" />
                  <div className={styles.articleOverlay} />
                  <div className={styles.articleContent}>
                    <div className={styles.articleTags}>
                      <span className={styles.articleTagOutline}>{featuredEditorial[0].tag}</span>
                      {featuredEditorial[0].meta_text && (
                        <span className={styles.articleMeta}>{featuredEditorial[0].meta_text}</span>
                      )}
                    </div>
                    <h3 className={`${styles.articleTitle} ${styles.articleTitleLg}`}>{featuredEditorial[0].title}</h3>
                    {featuredEditorial[0].excerpt && (
                      <p className={styles.articleExcerpt}>{featuredEditorial[0].excerpt}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {cardEditorial.map((a) => (
              <div key={a.id} className="reveal">
                <div className={`${styles.articleCard} ${styles.articleSmallWrap}`}>
                  <img src={imgOr(a.id, a.image_url, 400, 300)} alt="Editorial" />
                  <div className={styles.articleOverlay} />
                  <div className={styles.articleContent}>
                    <span className={styles.articleTag}>{a.tag}</span>
                    <h4 className={`${styles.articleTitle} ${styles.articleTitleSm}`}>{a.title}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.moreArticles}>
            {miniEditorial.map((a) => (
              <div key={a.id} className={`${styles.miniArticle} reveal`}>
                <img src={imgOr(a.id, a.image_url, 100, 100)} alt="" />
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

      <section id="membership" className={`${styles.section} ${styles.bgMatte} ${styles.membership}`}>
        <div className={styles.membershipBg}>
          <img src="https://picsum.photos/seed/afresh-member/1920/1080" alt="" />
        </div>
        <div className={styles.membershipGradient} />
        <div className={styles.membershipInner}>
          <p className="reveal label">Exclusive Access</p>
          <h2 className="reveal section-heading">
            <span>JOIN THE</span><br />
            <span className="gold-text">INNER CIRCLE</span>
          </h2>
          <p className={`${styles.editorialLead} reveal`} style={{ marginTop: "1.5rem" }}>Membership has its privileges. Early access, private collections, VIP events, and a seat at the table of culture.</p>
          <div className={`${styles.perksGrid} reveal`}>
            {[
              { icon: Clock, title: "24hr Early Access", desc: "Shop drops before anyone else" },
              { icon: Lock, title: "Private Collections", desc: "Invite-only pieces" },
              { icon: Sparkles, title: "VIP Events", desc: "Fashion shows & private views" },
              { icon: Gift, title: "Exclusive Gifts", desc: "Member-only accessories" },
            ].map((perk) => (
              <div key={perk.title} className={styles.perkCard}>
                <perk.icon size={18} />
                <h4>{perk.title}</h4>
                <p>{perk.desc}</p>
              </div>
            ))}
          </div>
          <div className={`${styles.signupRow} reveal`}>
            <input type="email" placeholder="Your email address" id="memberEmail" value={site.memberEmail} onChange={(e) => site.setMemberEmail(e.target.value)} />
            <button type="button" className="btn-primary" onClick={site.joinVIP}>Join VIP</button>
          </div>
          <p className={`${styles.signupNote} reveal`}>Free to join • No spam • Unsubscribe anytime</p>
        </div>
      </section>

      <section id="contact" className={`${styles.section} ${styles.bgGraphite}`}>
        <div className={styles.container}>
          <div className={styles.contactGrid}>
            <div>
              <p className="reveal label">Get In Touch</p>
              <h2 className="reveal section-heading">CONTACT</h2>
              <div className={`${styles.goldLine} reveal`} />
              <p className={`${styles.bodyText} reveal`} style={{ margin: "2rem 0" }}>For press, collaborations, wholesale inquiries, or just to connect with the movement.</p>
              <div className={`${styles.contactInfo} reveal`}>
                <div><Mail size={16} /><span>hello@afreshfashion.com</span></div>
                <div><MapPin size={16} /><span>Lagos, Nigeria</span></div>
                <div><Globe size={16} /><span>Global Shipping Available</span></div>
              </div>
            </div>
            <form className={styles.contactForm} id="contactForm" onSubmit={site.submitContact}>
              {["Name", "Email"].map((field) => (
                <div key={field} className={`${styles.formField} reveal`}>
                  <label>{field}</label>
                  <input type={field === "Email" ? "email" : "text"} required placeholder={field === "Name" ? "Your name" : "your@email.com"} />
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
                <textarea rows={4} required placeholder="Tell us what's on your mind" />
              </div>
              <div className="reveal">
                <button type="submit" className="btn-primary">Send Message</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <a href="#hero" className={styles.logoLink} onClick={(e) => { e.preventDefault(); site.scrollTo("#hero"); }}>
                <Logo size="lg" />
              </a>
              <p>A global fashion movement born from Africa. Fashion is armor. Style is language. Culture is currency.</p>
              <div className={styles.socialLinks}>
                <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
                <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
                <a href="#" aria-label="Youtube"><Youtube size={18} /></a>
                <a href="#" aria-label="Music"><Music size={18} /></a>
              </div>
            </div>
            {[
              { title: "Shop", links: ["New Arrivals", "Collections", "Lookbook", "Accessories", "Gift Cards"] },
              { title: "About", links: ["Our Story", "Manifesto", "Collaborations", "Careers", "Press"] },
              { title: "Help", links: ["Shipping & Returns", "Size Guide", "Contact Us", "FAQ", "Privacy Policy"] },
            ].map((col) => (
              <div key={col.title} className={styles.footerCol}>
                <h5>{col.title}</h5>
                {col.links.map((l) => (
                  <a key={l} href="#">{l}</a>
                ))}
              </div>
            ))}
          </div>
          <div className="section-divider" style={{ marginBottom: "2rem" }} />
          <div className={styles.footerBottom}>
            <p>
              © 2025 AFRESH. All rights reserved.
              <Link href="/admin" className={styles.footerStealth}> · ref. ss25/afr</Link>
            </p>
            <p>Lagos • Accra • Nairobi • London • NYC</p>
          </div>
        </div>
      </footer>

    </>
  );
}
