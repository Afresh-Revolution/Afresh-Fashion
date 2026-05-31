"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Logo from "@/components/Logo";
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

type OverviewStats = {
  publishedProducts: number;
  totalStock: number;
  totalProducts: number;
  unreadAlerts: number;
  pendingOrders: number;
  vipMembers: number;
  recentAlerts: { id: string; title: string; message: string; created_at: string }[];
};

const EMPTY_OVERVIEW: OverviewStats = {
  publishedProducts: 0,
  totalStock: 0,
  totalProducts: 0,
  unreadAlerts: 0,
  pendingOrders: 0,
  vipMembers: 0,
  recentAlerts: [],
};

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
  const [overview, setOverview] = useState<OverviewStats>(EMPTY_OVERVIEW);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [siteName, setSiteName] = useState("AFRESH");
  const [heroTagline, setHeroTagline] = useState("Global Fashion Movement — Born From Africa");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const unreadNotifs = overview.unreadAlerts;

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) return;
      const data = (await res.json()) as OverviewStats;
      setOverview(data);
    } catch {
      /* keep previous values */
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  useEffect(() => {
    setSiteName(localStorage.getItem("afresh_site_name") || "AFRESH");
    setHeroTagline(
      localStorage.getItem("afresh_hero_tagline") || "Global Fashion Movement — Born From Africa"
    );
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (tab === "overview") void loadOverview();
  }, [tab, loadOverview]);

  const saveSiteSettings = () => {
    localStorage.setItem("afresh_site_name", siteName);
    localStorage.setItem("afresh_hero_tagline", heroTagline);
    notify("Site settings saved");
  };

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
                <p>{overviewLoading ? "—" : overview.publishedProducts}</p>
                <p>Live Products</p>
              </div>
              <div className={styles.statCard}>
                <p>{overviewLoading ? "—" : overview.totalStock}</p>
                <p>Total Stock</p>
              </div>
              <div className={styles.statCard}>
                <p>{overviewLoading ? "—" : overview.unreadAlerts}</p>
                <p>Unread alerts</p>
              </div>
              <div className={styles.statCard}>
                <p>{overviewLoading ? "—" : overview.pendingOrders}</p>
                <p>Pending orders</p>
              </div>
            </div>
            {unreadNotifs > 0 && (
              <div className={styles.panel}>
                <p className={styles.panelTitle}>Recent alerts</p>
                {overview.recentAlerts.length > 0 ? (
                  <ul className={styles.notifList}>
                    {overview.recentAlerts.map((alert) => (
                      <li key={alert.id}>
                        <strong>{alert.title}</strong>
                        <span>{alert.message}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.panelHint}>
                    You have {unreadNotifs} unread notification{unreadNotifs === 1 ? "" : "s"}.
                  </p>
                )}
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
                void loadOverview();
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
