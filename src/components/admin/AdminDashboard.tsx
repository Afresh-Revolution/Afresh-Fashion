"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Logo from "@/components/Logo";
import {
  getDropSettings,
  getProducts,
  saveDropSettings,
  type AdminProduct,
  type DropSettings,
} from "@/lib/admin-store";
import AdminVipPanel from "@/components/admin/AdminVipPanel";
import {
  CinematicPanel,
  CollaboratorsPanel,
  CollectionsPanel,
  CommunityPanel,
  EditorialPanel,
  LookbookPanel,
  ShopPanel,
} from "@/components/admin/AdminContentPanels";
import styles from "@/styles/admin.module.scss";

type Tab =
  | "overview"
  | "collections"
  | "lookbook"
  | "cinematic"
  | "shop"
  | "community"
  | "collaborators"
  | "editorial"
  | "drops"
  | "vip"
  | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "collections", label: "Collections" },
  { id: "lookbook", label: "Lookbook" },
  { id: "cinematic", label: "Cinematic" },
  { id: "shop", label: "Shop" },
  { id: "community", label: "Community" },
  { id: "collaborators", label: "Ambassadors" },
  { id: "editorial", label: "Editorial" },
  { id: "drops", label: "Next Drop" },
  { id: "vip", label: "VIP Members" },
  { id: "settings", label: "Settings" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [drop, setDrop] = useState<DropSettings | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [toast, setToast] = useState("");
  const [siteName, setSiteName] = useState("AFRESH");
  const [heroTagline, setHeroTagline] = useState("Global Fashion Movement — Born From Africa");

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  useEffect(() => {
    setProducts(getProducts());
    setDrop(getDropSettings());
    setSiteName(localStorage.getItem("afresh_site_name") || "AFRESH");
    setHeroTagline(
      localStorage.getItem("afresh_hero_tagline") || "Global Fashion Movement — Born From Africa"
    );
    fetch("/api/admin/notifications?unread=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setUnreadNotifs(d.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  const saveDrop = () => {
    if (!drop) return;
    saveDropSettings(drop);
    notify("Drop settings saved");
  };

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

  return (
    <div className={styles.admin}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <Logo size="md" priority />
        </div>
        <nav className={styles.sidebarNav}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.navItem} ${tab === t.id ? styles.navItemActive : ""}`}
              onClick={() => setTab(t.id)}
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
          <Logo size="sm" />
          <Link href="/" className={styles.backLink}>
            ← Site
          </Link>
        </div>

        <div className={styles.mobileTabs}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.navItem} ${tab === t.id ? styles.navItemActive : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
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

        {tab === "drops" && drop && (
          <>
            <h1 className={styles.pageTitle}>NEXT DROP</h1>
            <p className={styles.pageDesc}>Configure the limited capsule shown on the landing page.</p>
            <div className={styles.panel}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Capsule title</label>
                  <input
                    value={drop.title}
                    onChange={(e) => setDrop({ ...drop, title: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Pieces worldwide</label>
                  <input
                    type="number"
                    value={drop.pieces}
                    onChange={(e) => setDrop({ ...drop, pieces: Number(e.target.value) })}
                  />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label>Subtitle</label>
                  <input
                    value={drop.subtitle}
                    onChange={(e) => setDrop({ ...drop, subtitle: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Drop date</label>
                  <input
                    type="datetime-local"
                    value={drop.dropDate.slice(0, 16)}
                    onChange={(e) => setDrop({ ...drop, dropDate: new Date(e.target.value).toISOString() })}
                  />
                </div>
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.btnPrimary} onClick={saveDrop}>
                  Save drop
                </button>
              </div>
            </div>
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
