"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isPwaMode, shouldOfferPullToRefresh } from "@/lib/pwa";
import styles from "@/styles/pwa.module.scss";

const PULL_THRESHOLD = 72;
const MAX_PULL = 120;

export default function PwaPullToRefresh() {
  const pathname = usePathname();
  const enabled = isPwaMode() && shouldOfferPullToRefresh(pathname);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 4 || refreshing) return;
      startY.current = e.touches[0]?.clientY ?? 0;
      pulling.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshing) return;
      const y = e.touches[0]?.clientY ?? 0;
      const delta = y - startY.current;
      if (window.scrollY > 4 || delta <= 0) {
        setPull(0);
        return;
      }
      const amount = Math.min(delta * 0.45, MAX_PULL);
      setPull(amount);
      if (amount > 10) e.preventDefault();
    };

    const onTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pull >= PULL_THRESHOLD && !refreshing) {
        setRefreshing(true);
        window.location.reload();
        return;
      }
      setPull(0);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, pull, refreshing]);

  if (!enabled) return null;

  const active = pull > 12 || refreshing;

  return (
    <div
      className={`${styles.pullZone} ${active ? styles.pullZoneActive : ""}`}
      style={{ transform: `translateY(${Math.min(pull, MAX_PULL) * 0.35}px)` }}
      aria-hidden
    >
      {refreshing ? (
        <>
          <span className={styles.pullSpinner} />
          <span className={styles.pullLabel}>Refreshing</span>
        </>
      ) : (
        <span className={styles.pullLabel}>
          {pull >= PULL_THRESHOLD ? "Release to refresh" : "Pull to refresh"}
        </span>
      )}
    </div>
  );
}
