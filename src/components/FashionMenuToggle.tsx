"use client";

import styles from "@/styles/fashion-menu.module.scss";

type Props = {
  open: boolean;
  onClick: () => void;
  label?: string;
};

export default function FashionMenuToggle({ open, onClick, label = "Menu" }: Props) {
  return (
    <button
      type="button"
      className={`${styles.toggle} ${open ? styles.open : ""}`}
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.iconWrap} aria-hidden="true">
        <span className={styles.line} />
        <span className={styles.diamond}>✦</span>
        <span className={styles.line} />
      </span>
    </button>
  );
}
