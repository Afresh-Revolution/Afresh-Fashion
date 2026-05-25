"use client";

import { useCallback, useEffect, useState } from "react";
import { vipSubscriptionEmail } from "@/lib/emails/templates";
import styles from "@/styles/admin.module.scss";

type Notify = (msg: string) => void;

type VipMember = {
  id: string;
  email: string;
  source: string;
  is_active: boolean;
  joined_at: string;
};

type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

type CampaignForm = {
  subject: string;
  headline: string;
  intro: string;
  price_line: string;
  description: string;
  perks: string;
  cta_label: string;
  cta_url: string;
  footer_note: string;
};

const DEFAULT_CAMPAIGN: CampaignForm = {
  subject: "AFRESH VIP — Early access to the next drop",
  headline: "Your Inner Circle allocation",
  intro:
    "As a VIP member, you receive first access to our latest capsule — curated pieces with limited worldwide availability.",
  price_line: "From ₦65,000 · Pieces from ₦95,000",
  description:
    "This drop includes heritage outerwear, premium tees, and signature accessories. Stock is extremely limited.",
  perks: "✦ 24hr early access before public release\n✦ Invite-only pricing on select pieces\n✦ Free shipping on orders over ₦150,000",
  cta_label: "Shop early access",
  cta_url: "/#shop",
  footer_note: "You're receiving this as an AFRESH Inner Circle member.",
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export default function AdminVipPanel({ notify }: { notify: Notify }) {
  const [members, setMembers] = useState<VipMember[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [campaign, setCampaign] = useState<CampaignForm>(DEFAULT_CAMPAIGN);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const load = useCallback(async () => {
    const [memberData, notifData] = await Promise.all([
      api<VipMember[]>("/api/admin/vip-members"),
      api<{ notifications: AdminNotification[]; unreadCount: number }>("/api/admin/notifications"),
    ]);
    setMembers(memberData);
    setNotifications(notifData.notifications);
    setUnreadCount(notifData.unreadCount);
  }, []);

  useEffect(() => {
    load()
      .catch(() => notify("Could not load VIP data"))
      .finally(() => setLoading(false));
  }, [load, notify]);

  const markAllRead = async () => {
    await api("/api/admin/notifications", {
      method: "PATCH",
      body: JSON.stringify({ markAllRead: true }),
    });
    await load();
    notify("Notifications cleared");
  };

  const sendCampaign = async () => {
    if (!campaign.subject.trim() || !campaign.headline.trim()) {
      notify("Subject and headline are required");
      return;
    }
    if (!confirm(`Send subscription email to ${members.filter((m) => m.is_active).length} active VIP members?`)) {
      return;
    }
    setSending(true);
    try {
      const result = await api<{ sent: number }>("/api/admin/vip-campaigns", {
        method: "POST",
        body: JSON.stringify({ action: "send", ...campaign }),
      });
      notify(`Campaign sent to ${result.sent} members`);
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const previewHtml = vipSubscriptionEmail({
    headline: campaign.headline,
    intro: campaign.intro,
    priceLine: campaign.price_line || undefined,
    description: campaign.description || undefined,
    perks: campaign.perks || undefined,
    ctaLabel: campaign.cta_label,
    ctaUrl: campaign.cta_url.startsWith("http") ? campaign.cta_url : `https://example.com${campaign.cta_url}`,
    footerNote: campaign.footer_note || undefined,
  }).html;

  if (loading) return <p className={styles.empty}>Loading VIP data…</p>;

  return (
    <div className={styles.vipPanel}>
      <div className={styles.panel}>
        <div className={styles.panelHeaderRow}>
          <p className={styles.panelTitle}>
            Notifications {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount}</span>}
          </p>
          {unreadCount > 0 && (
            <button type="button" className={styles.btnSmall} onClick={() => void markAllRead()}>
              Mark all read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className={styles.empty}>No notifications yet.</p>
        ) : (
          <ul className={styles.notifList}>
            {notifications.slice(0, 8).map((n) => (
              <li key={n.id} className={n.read_at ? styles.notifRead : styles.notifUnread}>
                <strong>{n.title}</strong>
                <span>{n.message}</span>
                <time>{new Date(n.created_at).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.panel}>
        <p className={styles.panelTitle}>Subscription email — send to all VIP</p>
        <p className={styles.panelHint}>
          Compose your offer (prices, description, perks). Resend delivers to every active member.
        </p>
        <div className={styles.formGrid}>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Email subject</label>
            <input
              value={campaign.subject}
              onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
            />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Headline</label>
            <input
              value={campaign.headline}
              onChange={(e) => setCampaign({ ...campaign, headline: e.target.value })}
            />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Intro</label>
            <textarea
              rows={3}
              value={campaign.intro}
              onChange={(e) => setCampaign({ ...campaign, intro: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Price line</label>
            <input
              value={campaign.price_line}
              onChange={(e) => setCampaign({ ...campaign, price_line: e.target.value })}
              placeholder="From ₦65,000 · Heritage Bomber ₦185,000"
            />
          </div>
          <div className={styles.field}>
            <label>CTA label</label>
            <input
              value={campaign.cta_label}
              onChange={(e) => setCampaign({ ...campaign, cta_label: e.target.value })}
            />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Description</label>
            <textarea
              rows={3}
              value={campaign.description}
              onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
            />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Perks (one per line)</label>
            <textarea
              rows={4}
              value={campaign.perks}
              onChange={(e) => setCampaign({ ...campaign, perks: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>CTA link</label>
            <input
              value={campaign.cta_url}
              onChange={(e) => setCampaign({ ...campaign, cta_url: e.target.value })}
              placeholder="/#shop"
            />
          </div>
          <div className={styles.field}>
            <label>Footer note</label>
            <input
              value={campaign.footer_note}
              onChange={(e) => setCampaign({ ...campaign, footer_note: e.target.value })}
            />
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={() => setShowPreview((p) => !p)}>
            {showPreview ? "Hide preview" : "Preview email"}
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={sending || members.length === 0}
            onClick={() => void sendCampaign()}
          >
            {sending ? "Sending…" : `Send to ${members.filter((m) => m.is_active).length} VIPs`}
          </button>
        </div>
        {showPreview && (
          <iframe
            title="Email preview"
            className={styles.emailPreview}
            srcDoc={previewHtml}
            sandbox=""
          />
        )}
      </div>

      <div className={styles.panel}>
        <p className={styles.panelTitle}>VIP members ({members.length})</p>
        {members.length === 0 ? (
          <p className={styles.empty}>No signups yet — they appear when visitors join on the landing page.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Source</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((v) => (
                <tr key={v.id}>
                  <td>{v.email}</td>
                  <td>{v.source}</td>
                  <td>{new Date(v.joined_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
