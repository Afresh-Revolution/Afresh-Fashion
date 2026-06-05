"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatNaira, resolveImage } from "@/hooks/useSiteContent";
import { Skeleton } from "@/components/Skeleton";
import sk from "@/styles/skeleton.module.scss";
import styles from "@/styles/checkout.module.scss";

type Hit = {
  id: string;
  slug: string;
  name: string;
  price_amount: number;
  category_name: string;
  image_url: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (productId: string) => void;
  currency?: string;
};

export default function SearchOverlay({ open, onClose, onSelect, currency = "₦" }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
      return;
    }
    const t = setTimeout(() => void search(q), 280);
    return () => clearTimeout(t);
  }, [q, open, search]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.searchOverlay} role="dialog" aria-modal="true" aria-label="Search products">
      <button type="button" className={styles.searchClose} onClick={onClose} aria-label="Close search">
        <X size={22} />
      </button>
      <div className={styles.searchInner}>
        <input
          className={styles.searchInput}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the shop…"
          autoFocus
        />
        {loading && (
          <div aria-hidden>
            {[1, 2, 3].map((i) => (
              <div key={i} className={sk.searchHitSkeleton}>
                <Skeleton className={sk.searchHitImage} />
                <div className={sk.searchHitText}>
                  <Skeleton style={{ width: "60%", height: "0.875rem" }} />
                  <Skeleton style={{ width: "40%", height: "0.625rem" }} />
                </div>
                <Skeleton style={{ width: "3rem", height: "0.8125rem" }} />
              </div>
            ))}
          </div>
        )}
        {!loading && q.length >= 2 && results.length === 0 && (
          <p style={{ color: "#BFC0C0", fontSize: "0.875rem" }}>No pieces found.</p>
        )}
        <div className={styles.searchResults}>
          {results.map((hit) => (
            <button
              key={hit.id}
              type="button"
              className={styles.searchHit}
              onClick={() => {
                onSelect(hit.id);
                onClose();
              }}
            >
              <img src={resolveImage(hit.slug, hit.image_url, 80, 100)} alt="" />
              <div>
                <p style={{ color: "#F5F5F5", fontSize: "0.875rem" }}>{hit.name}</p>
                <p style={{ color: "#888", fontSize: "10px", letterSpacing: "0.1em" }}>{hit.category_name}</p>
              </div>
              <span style={{ color: "#C8A96B", fontSize: "0.8125rem" }}>
                {formatNaira(hit.price_amount, currency)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
