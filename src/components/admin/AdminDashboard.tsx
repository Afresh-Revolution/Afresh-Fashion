"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { getProducts, type AdminProduct } from "@/lib/admin-store";
import AdminVipPanel from "@/components/admin/AdminVipPanel";
import FashionMenuToggle from "@/components/FashionMenuToggle";
import {
  AboutPanel,
  HeroPanel,
  HelpPanel,
  CinematicPanel,
  CollaboratorsPanel,
  CollectionsPanel,
  CommunityPanel,
  DropPanel,
  EditorialPanel,
  OrdersPanel,
  LookbookPanel,
  ShopPanel,
} from "@/components/admin/AdminContentPanels";
import styles from "@/styles/admin.module.scss";

type Tab =
  | "overview"
  | "hero"
  | "collections"
  | "lookbook"
  | "cinematic"
  | "shop"
  | "community"
  | "collaborators"
  | "editorial"
  | "about"
  | "drops"
  | "vip"
  | "orders"
  | "help"
  | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "hero", label: "Hero" },
  { id: "collections", label: "Collections" },
  { id: "lookbook", label: "Lookbook" },
  { id: "cinematic", label: "Cinematic" },
  { id: "shop", label: "Shop" },
  { id: "community", label: "Community" },
  { id: "collaborators", label: "Ambassadors" },
  { id: "editorial", label: "Editorial" },
  { id: "about", label: "About" },
  { id: "drops", label: "Next Drop" },
  { id: "vip", label: "VIP Members" },
  { id: "orders", label: "Orders" },
  { id: "help", label: "Help & Footer" },
  { id: "settings", label: "Settings" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [toast, setToast] = useState("");
  const [siteName, setSiteName] = useState("AFRESH");
  const [heroTagline, setHeroTagline] = useState("Global Fashion Movement — Born From Africa");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  useEffect(() => {
    setProducts(getProducts());
    setSiteName(localStorage.getItem("afresh_site_name") || "AFRESH");
    setHeroTagline(
      localStorage.getItem("afresh_hero_tagline") || "Global Fashion Movement — Born From Africa"
    );
    fetch("/api/admin/notifications?unread=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setUnreadNotifs(d.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  const saveSiteSettings = () => {
    localStorage.setItem("afresh_site_name", siteName);
    localStorage.setItem("afresh_hero_tagline", heroTagline);
    notify("Site settings saved");
  };

  const publishedCount = products.filter((p) => p.status === "published").length;
  const totalStock = products.reduce((s, p) => s + p.stock, 0);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const selectTab = (id: Tab) => {
    setTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className={styles.admin}>
      <div
        className={`${styles.sidebarBackdrop} ${sidebarOpen ? styles.sidebarBackdropVisible : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarLogo}>
          <Logo size="md" priority />
        </div>
        <nav className={styles.sidebarNav}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.navItem} ${tab === t.id ? styles.navItemActive : ""}`}
              onClick={() => selectTab(t.id)}
            >
              {t.label}
              {t.id === "vip" && unreadNotifs > 0 && (
                <span className={styles.navBadge}>{unreadNotifs}</span>
              )}
            </button>
          ))}
        </nav>
        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
          Sign out
        </button>
        <Link href="/" className={styles.backLink}>
          ← Back to site
        </Link>
      </aside>

      <main className={styles.main}>
        <div className={styles.mobileHeader}>
          <div className={styles.mobileHeaderLeft}>
            <FashionMenuToggle open={sidebarOpen} onClick={() => setSidebarOpen((o) => !o)} label="Studio" />
            <Logo size="sm" />
          </div>
          <Link href="/" className={styles.backLink}>
            ← Site
          </Link>
        </div>

        <div className={styles.mobileTabs}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.tabPill} ${tab === t.id ? styles.tabPillActive : ""}`}
              onClick={() => selectTab(t.id)}
            >
              {t.label}
              {t.id === "vip" && unreadNotifs > 0 && (
                <span className={styles.navBadge}>{unreadNotifs}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            <h1 className={styles.pageTitle}>OVERVIEW</h1>
            <p className={styles.pageDesc}>Studio dashboard — collections, drops, and community at a glance.</p>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <p>{publishedCount}</p>
                <p>Live Products</p>
              </div>
              <div className={styles.statCard}>
                <p>{totalStock}</p>
                <p>Total Stock</p>
              </div>
              <div className={styles.statCard}>
                <p>{unreadNotifs}</p>
                <p>Unread alerts</p>
              </div>
              <div className={styles.statCard}>
                <p>{publishedCount}</p>
                <p>Shop items (local)</p>
              </div>
            </div>
            {unreadNotifs > 0 && (
              <div className={styles.panel}>
                <p className={styles.panelTitle}>Recent alerts</p>
                <p className={styles.panelHint}>
                  You have {unreadNotifs} unread notification{unreadNotifs === 1 ? "" : "s"}. Open VIP Members to review.
                </p>
                <button type="button" className={styles.btnGhost} onClick={() => setTab("vip")}>
                  View notifications
                </button>
              </div>
            )}
          </>
        )}

        {tab === "hero" && (
          <>
            <h1 className={styles.pageTitle}>HERO</h1>
            <p className={styles.pageDesc}>
              Homepage hero copy, slideshow backgrounds, and CTAs.
            </p>
            <HeroPanel notify={notify} />
          </>
        )}

        {tab === "collections" && (
          <>
            <h1 className={styles.pageTitle}>COLLECTIONS</h1>
            <p className={styles.pageDesc}>Manage SS/25 collection cards — images upload to Backblaze.</p>
            <CollectionsPanel notify={notify} />
          </>
        )}

        {tab === "lookbook" && (
          <>
            <h1 className={styles.pageTitle}>LOOKBOOK</h1>
            <p className={styles.pageDesc}>Horizontal scroll looks for the editorial section.</p>
            <LookbookPanel notify={notify} />
          </>
        )}

        {tab === "cinematic" && (
          <>
            <h1 className={styles.pageTitle}>CINEMATIC</h1>
            <p className={styles.pageDesc}>Quote section and landscape fashion films (under 100MB each).</p>
            <CinematicPanel notify={notify} />
          </>
        )}

        {tab === "shop" && (
          <>
            <h1 className={styles.pageTitle}>SHOP</h1>
            <p className={styles.pageDesc}>Products, pricing, swatches, and publication status.</p>
            <ShopPanel notify={notify} />
          </>
        )}

        {tab === "community" && (
          <>
            <h1 className={styles.pageTitle}>COMMUNITY</h1>
            <p className={styles.pageDesc}>Instagram-style grid posts from the movement.</p>
            <CommunityPanel notify={notify} />
          </>
        )}

        {tab === "collaborators" && (
          <>
            <h1 className={styles.pageTitle}>COLLABORATORS</h1>
            <p className={styles.pageDesc}>Ambassadors and creative partners shown below community.</p>
            <CollaboratorsPanel notify={notify} />
          </>
        )}

        {tab === "editorial" && (
          <>
            <h1 className={styles.pageTitle}>EDITORIAL</h1>
            <p className={styles.pageDesc}>Featured, card, and mini articles for the media section.</p>
            <EditorialPanel notify={notify} />
          </>
        )}

        {tab === "about" && (
          <>
            <h1 className={styles.pageTitle}>ABOUT</h1>
            <p className={styles.pageDesc}>Manifesto copy, story CTA, and the stats row (countries, collections, etc.).</p>
            <AboutPanel notify={notify} />
          </>
        )}

        {tab === "drops" && (
          <>
            <h1 className={styles.pageTitle}>NEXT DROP</h1>
            <p className={styles.pageDesc}>
              Countdown, background image, CTAs, and footnote for the limited capsule section.
            </p>
            <DropPanel notify={notify} />
          </>
        )}

        {tab === "orders" && (
          <>
            <h1 className={styles.pageTitle}>ORDERS</h1>
            <p className={styles.pageDesc}>
              Confirm manual bank transfers and send delivery details to customers.
            </p>
            <OrdersPanel notify={notify} />
          </>
        )}

        {tab === "vip" && (
          <>
            <h1 className={styles.pageTitle}>VIP MEMBERS</h1>
            <p className={styles.pageDesc}>
              Signups via Resend welcome email · admin alerts · subscription campaigns to all VIPs.
            </p>
            <AdminVipPanel
              notify={(msg) => {
                notify(msg);
                fetch("/api/admin/notifications?unread=1")
                  .then((r) => (r.ok ? r.json() : null))
                  .then((d) => d && setUnreadNotifs(d.unreadCount ?? 0))
                  .catch(() => {});
              }}
            />
          </>
        )}

        {tab === "help" && (
          <>
            <h1 className={styles.pageTitle}>HELP & FOOTER</h1>
            <p className={styles.pageDesc}>
              Shipping, size guide, contact, FAQ, and privacy popups — plus contact email.
            </p>
            <HelpPanel notify={notify} />
          </>
        )}

        {tab === "settings" && (
          <>
            <h1 className={styles.pageTitle}>SETTINGS</h1>
            <p className={styles.pageDesc}>Site copy and brand references (stored locally).</p>
            <div className={styles.panel}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Brand name</label>
                  <input value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label>Hero tagline</label>
                  <input value={heroTagline} onChange={(e) => setHeroTagline(e.target.value)} />
                </div>
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.btnPrimary} onClick={saveSiteSettings}>
                  Save settings
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <div className={`${styles.toast} ${toast ? styles.visible : ""}`}>{toast}</div>
    </div>
  );
}
