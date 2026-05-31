"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import styles from "@/styles/image-lightbox.module.scss";

export type LightboxImage = {
  src: string;
  alt: string;
};

export type LightboxState = {
  images: LightboxImage[];
  index: number;
} | null;

type Props = {
  state: LightboxState;
  onClose: () => void;
};

export default function ImageLightbox({ state, onClose }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (state) setIndex(state.index);
  }, [state]);

  const images = state?.images ?? [];
  const hasMany = images.length > 1;
  const current = images[index];

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!state) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasMany) goPrev();
      if (e.key === "ArrowRight" && hasMany) goNext();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [state, onClose, hasMany, goPrev, goNext]);

  if (!state || !current) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={onClose}
    >
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
        <X size={20} />
      </button>

      <div className={styles.stage} onClick={(e) => e.stopPropagation()}>
        {hasMany && (
          <button type="button" className={`${styles.nav} ${styles.navPrev}`} onClick={goPrev} aria-label="Previous image">
            <ChevronLeft size={22} />
          </button>
        )}

        <img key={current.src} src={current.src} alt={current.alt} className={styles.image} draggable={false} />

        {hasMany && (
          <button type="button" className={`${styles.nav} ${styles.navNext}`} onClick={goNext} aria-label="Next image">
            <ChevronRight size={22} />
          </button>
        )}

        {hasMany && (
          <span className={styles.counter} aria-live="polite">
            {index + 1} / {images.length}
          </span>
        )}
      </div>
    </div>
  );
}
