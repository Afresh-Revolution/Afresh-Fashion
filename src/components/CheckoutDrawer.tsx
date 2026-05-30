"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatNaira, resolveImage } from "@/hooks/useSiteContent";
import type { useCart } from "@/hooks/useCart";
import type { CheckoutForm, OrderSummary } from "@/types/cart";
import styles from "@/styles/checkout.module.scss";

type CartApi = ReturnType<typeof useCart>;

type PaymentConfig = {
  manual: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    contactUrl: string;
  };
  paystack: { enabled: boolean; publicKey: string | null };
};

type Props = {
  cart: CartApi;
  currency?: string;
  showToast: (msg: string) => void;
  onShopMore: () => void;
};

const defaultForm: CheckoutForm = {
  email: "",
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  country: "Nigeria",
  postal_code: "",
  customer_notes: "",
};

export default function CheckoutDrawer({ cart, currency = "₦", showToast, onShopMore }: Props) {
  const [form, setForm] = useState<CheckoutForm>(defaultForm);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"choose" | "manual">("choose");
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (cart.checkoutOpen) {
      fetch("/api/payment/config")
        .then((r) => r.json())
        .then(setConfig)
        .catch(() => {});
    } else {
      setPaymentOpen(false);
      setPaymentStep("choose");
      setOrder(null);
    }
  }, [cart.checkoutOpen]);

  const set = (key: keyof CheckoutForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validateForm = () => {
    if (!form.email.includes("@")) return "Valid email is required";
    if (!form.full_name.trim()) return "Full name is required";
    if (!form.phone.trim()) return "Phone is required";
    if (!form.address_line1.trim()) return "Address is required";
    if (!form.city.trim()) return "City is required";
    if (!form.state.trim()) return "State is required";
    if (!form.country.trim()) return "Country is required";
    return null;
  };

  const proceedToPayment = async () => {
    const err = validateForm();
    if (err) {
      showToast(err);
      return;
    }
    setSubmitting(true);
    try {
      const { order: created } = await cart.createOrder(form);
      setOrder(created);
      setPaymentOpen(true);
      setPaymentStep("choose");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not start checkout");
    } finally {
      setSubmitting(false);
    }
  };

  const manualPaid = async () => {
    if (!order) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/manual-paid`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message || "Payment submitted");
      cart.setCheckoutOpen(false);
      await cart.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  const paystackPay = async () => {
    if (!order) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/paystack/initialize`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.authorization_url;
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Paystack unavailable");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${cart.checkoutOpen ? styles.visible : ""}`}
        onClick={() => cart.setCheckoutOpen(false)}
        aria-hidden={!cart.checkoutOpen}
      />
      <aside className={`${styles.drawer} ${cart.checkoutOpen ? styles.open : ""}`} aria-hidden={!cart.checkoutOpen}>
        <div className={styles.header}>
          <h2 className={styles.title}>Your bag</h2>
          <button type="button" className={styles.closeBtn} onClick={() => cart.setCheckoutOpen(false)} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.sectionLabel}>Items</p>
          {cart.cart.items.map((item) => (
            <div key={item.id} className={styles.lineItem}>
              <div className={styles.lineImage}>
                <img src={resolveImage(item.slug, item.image_url, 120, 160)} alt={item.name} />
              </div>
              <div>
                <p className={styles.lineName}>{item.name}</p>
                <p className={styles.linePrice}>{formatNaira(item.unit_price, currency)} each</p>
                <div className={styles.qtyRow}>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => void cart.updateQuantity(item.product_id, Math.max(0, item.quantity - 1))}
                  >
                    −
                  </button>
                  <span style={{ color: "#F5F5F5", minWidth: "1.5rem", textAlign: "center" }}>{item.quantity}</span>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => void cart.updateQuantity(item.product_id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock_quantity}
                  >
                    +
                  </button>
                </div>
                <button type="button" className={styles.removeBtn} onClick={() => void cart.removeItem(item.product_id)}>
                  Remove
                </button>
              </div>
              <p className={styles.linePrice}>{formatNaira(item.line_total, currency)}</p>
            </div>
          ))}

          <button
            type="button"
            className={styles.chooseMore}
            onClick={() => {
              cart.setCheckoutOpen(false);
              onShopMore();
            }}
          >
            + Choose more pieces
          </button>

          <p className={styles.sectionLabel} style={{ marginTop: "1.5rem" }}>
            Delivery details
          </p>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Email *</label>
              <input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" />
            </div>
            <div className={styles.field}>
              <label>Full name *</label>
              <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Phone (WhatsApp) *</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Street address *</label>
              <input value={form.address_line1} onChange={(e) => set("address_line1", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Apartment / landmark</label>
              <input value={form.address_line2} onChange={(e) => set("address_line2", e.target.value)} />
            </div>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label>City *</label>
                <input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>State *</label>
                <input value={form.state} onChange={(e) => set("state", e.target.value)} />
              </div>
            </div>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label>Country *</label>
                <input value={form.country} onChange={(e) => set("country", e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Postal code</label>
                <input value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} />
              </div>
            </div>
            <div className={styles.field}>
              <label>Order notes</label>
              <textarea
                value={form.customer_notes}
                onChange={(e) => set("customer_notes", e.target.value)}
                placeholder="Size, delivery instructions…"
              />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.totalRow}>
            <span>Subtotal ({cart.cart.item_count} items)</span>
            <span>{formatNaira(cart.cart.subtotal_amount, currency)}</span>
          </div>
          <p className={styles.totalAmount}>{formatNaira(cart.cart.subtotal_amount, currency)}</p>
          <button
            type="button"
            className={styles.payBtn}
            disabled={submitting || cart.cart.item_count === 0}
            onClick={() => void proceedToPayment()}
          >
            {submitting ? "Please wait…" : "Proceed to payment"}
          </button>
        </div>
      </aside>

      {paymentOpen && order && (
        <div className={styles.paymentOverlay} onClick={() => setPaymentOpen(false)}>
          <div className={styles.paymentCard} onClick={(e) => e.stopPropagation()}>
            {paymentStep === "choose" && (
              <>
                <p className={styles.paymentTitle}>Payment method</p>
                <p style={{ color: "#BFC0C0", fontSize: "0.8125rem", textAlign: "center", marginBottom: "1rem" }}>
                  Order {order.order_number} · {formatNaira(order.total_amount, currency)}
                </p>
                <button type="button" className={styles.methodBtn} onClick={() => setPaymentStep("manual")}>
                  Bank transfer (manual)
                </button>
                {config?.paystack.enabled && (
                  <button type="button" className={styles.methodBtn} onClick={() => void paystackPay()} disabled={submitting}>
                    Pay with card / Paystack
                  </button>
                )}
                {!config?.paystack.enabled && (
                  <p style={{ fontSize: "0.75rem", color: "#888", textAlign: "center" }}>
                    Card payments coming soon — use bank transfer
                  </p>
                )}
              </>
            )}
            {paymentStep === "manual" && config && (
              <>
                <p className={styles.paymentTitle}>Bank transfer</p>
                <div className={styles.bankBox}>
                  <span>Account name</span>
                  <strong>{config.manual.accountName}</strong>
                  <span style={{ marginTop: "0.75rem" }}>Bank</span>
                  <strong>{config.manual.bankName}</strong>
                  <span style={{ marginTop: "0.75rem" }}>Account number</span>
                  <strong>{config.manual.accountNumber}</strong>
                  <span style={{ marginTop: "0.75rem" }}>Amount</span>
                  <strong>{formatNaira(order.total_amount, currency)}</strong>
                </div>
                {config.manual.contactUrl && (
                  <a href={config.manual.contactUrl} target="_blank" rel="noopener noreferrer" className={styles.whatsApp}>
                    Contact us on WhatsApp after paying
                  </a>
                  
                )}
                <button type="button" className={styles.paidBtn} onClick={() => void manualPaid()} disabled={submitting}>
                  I&apos;ve paid — submit for confirmation
                </button>
                <button
                  type="button"
                  className={styles.methodBtn}
                  style={{ marginTop: "0.5rem" }}
                  onClick={() => setPaymentStep("choose")}
                >
                  ← Back
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
