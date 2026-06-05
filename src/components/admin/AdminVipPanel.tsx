"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { vipSubscriptionEmail } from "@/lib/emails/templates";
import { useConfirm } from "@/components/ConfirmProvider";
import styles from "@/styles/admin.module.scss";
import { AdminVipSkeleton } from "@/components/admin/AdminSkeleton";

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
  footer_note: "You're receiving this as an AFRESH Inner Circle member. Paid members may cancel anytime by replying to this email. All membership fees are non-refundable.",
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
  const confirmAction = useConfirm();
  const [members, setMembers] = useState<VipMember[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [campaign, setCampaign] = useState<CampaignForm>(DEFAULT_CAMPAIGN);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

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

  const openCancelForm = (memberId: string) => {
    setCancelTarget(memberId);
    setCancelReason("");
  };

  const cancelMembership = async (member: VipMember) => {
    const reason = cancelReason.trim();
    if (reason.length < 10) {
      notify("Add a cancellation reason (at least 10 characters) for the member email");
      return;
    }
    if (
      !(await confirmAction({
        title: "Cancel membership",
        message: `Cancel ${member.email}'s Inner Circle membership? They will receive your message by email and lose VIP access.`,
        confirmLabel: "Send cancellation email",
        cancelLabel: "Keep member",
        tone: "danger",
      }))
    ) {
      return;
    }

    setCancelling(true);
    try {
      await api<{ email: string }>(`/api/admin/vip-members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "cancel", reason }),
      });
      notify(`Membership cancelled — email sent to ${member.email}`);
      setCancelTarget(null);
      setCancelReason("");
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not cancel membership");
    } finally {
      setCancelling(false);
    }
  };

  const sendCampaign = async () => {
    if (!campaign.subject.trim() || !campaign.headline.trim()) {
      notify("Subject and headline are required");
      return;
    }
    const activeCount = members.filter((m) => m.is_active).length;
    if (
      !(await confirmAction({
        title: "Send campaign",
        message: `Send subscription email to ${activeCount} active VIP member${activeCount === 1 ? "" : "s"}?`,
        confirmLabel: "Send now",
        cancelLabel: "Not yet",
      }))
    ) {
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

  const removeMember = async (member: VipMember) => {
    if (
      !(await confirmAction({
        title: "Remove from system",
        message: `Permanently delete ${member.email} from VIP records? This cannot be undone.`,
        confirmLabel: "Remove permanently",
        cancelLabel: "Keep record",
        tone: "danger",
      }))
    ) {
      return;
    }

    setRemovingId(member.id);
    try {
      await api<{ email: string }>(`/api/admin/vip-members/${member.id}`, { method: "DELETE" });
      notify(`${member.email} removed from the system`);
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not remove member");
    } finally {
      setRemovingId(null);
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

  if (loading) return <AdminVipSkeleton />;

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
          Compose your offer (prices, description, perks). To every active member.
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
        <p className={styles.panelHint}>
          Cancel a membership to remove VIP access and send a custom cancellation email. Cancelled records can be
          permanently removed from the system. Paid members may also cancel themselves by replying to any AFRESH
          email — membership fees are non-refundable.
        </p>
        {members.length === 0 ? (
          <p className={styles.empty}>No signups yet — they appear when visitors join on the landing page.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Source</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {members.map((v) => {
                  const isActive = v.is_active;
                  const isCancelling = cancelTarget === v.id;

                  return (
                    <Fragment key={v.id}>
                      <tr className={styles.vipMemberRow}>
                        <td>{v.email}</td>
                        <td>{v.source}</td>
                        <td>{new Date(v.joined_at).toLocaleString()}</td>
                        <td>
                          <span className={isActive ? styles.vipStatusActive : styles.vipStatusCancelled}>
                            {isActive ? "Active" : "Cancelled"}
                          </span>
                        </td>
                        <td>
                          {isActive && !isCancelling ? (
                            <button
                              type="button"
                              className={styles.btnDanger}
                              onClick={() => openCancelForm(v.id)}
                            >
                              Cancel
                            </button>
                          ) : !isActive && !isCancelling ? (
                            <button
                              type="button"
                              className={styles.btnDanger}
                              disabled={removingId === v.id}
                              onClick={() => void removeMember(v)}
                            >
                              {removingId === v.id ? "Removing…" : "Remove"}
                            </button>
                          ) : (
                            <span className={styles.panelHint}>—</span>
                          )}
                        </td>
                      </tr>
                      {isCancelling && (
                        <tr>
                          <td colSpan={5}>
                            <div className={styles.vipCancelForm}>
                              <label className={styles.vipCancelFormLabel} htmlFor={`cancel-reason-${v.id}`}>
                                Cancellation email message
                              </label>
                              <textarea
                                id={`cancel-reason-${v.id}`}
                                rows={4}
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Explain why this membership is being cancelled. This text is sent to the member."
                              />
                              <div className={styles.actions} style={{ marginTop: 0 }}>
                                <button
                                  type="button"
                                  className={styles.btnGhost}
                                  disabled={cancelling}
                                  onClick={() => {
                                    setCancelTarget(null);
                                    setCancelReason("");
                                  }}
                                >
                                  Back
                                </button>
                                <button
                                  type="button"
                                  className={styles.btnDanger}
                                  disabled={cancelling || cancelReason.trim().length < 10}
                                  onClick={() => void cancelMembership(v)}
                                >
                                  {cancelling ? "Sending…" : "Send cancellation email"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
