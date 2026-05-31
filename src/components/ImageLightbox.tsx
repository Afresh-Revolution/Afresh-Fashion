"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

function isInsideImage(clientX: number, clientY: number, rect: DOMRect | undefined) {
  if (!rect) return false;
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

export default function ImageLightbox({ state, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const pointerOnImageRef = useRef(false);

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

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleImagePointerDown = useCallback((e: React.PointerEvent<HTMLImageElement>) => {
    e.stopPropagation();
    pointerOnImageRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handleImagePointerUp = useCallback(
    (e: React.PointerEvent<HTMLImageElement>) => {
      if (!pointerOnImageRef.current) return;
      pointerOnImageRef.current = false;

      const rect = imageRef.current?.getBoundingClientRect();
      if (!isInsideImage(e.clientX, e.clientY, rect)) {
        onClose();
      }
    },
    [onClose],
  );

  const handleOverlayPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerOnImageRef.current) return;
      pointerOnImageRef.current = false;

      const rect = imageRef.current?.getBoundingClientRect();
      if (!isInsideImage(e.clientX, e.clientY, rect)) {
        onClose();
      }
    },
    [onClose],
  );

  const stopClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

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
      pointerOnImageRef.current = false;
    };
  }, [state, onClose, hasMany, goPrev, goNext]);

  if (!state || !current) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={handleBackdropClick}
      onPointerUp={handleOverlayPointerUp}
    >
      <div className={styles.stage} onClick={handleBackdropClick}>
        {hasMany && (
          <button
            type="button"
            className={`${styles.nav} ${styles.navPrev}`}
            onClick={(e) => {
              stopClick(e);
              goPrev();
            }}
            aria-label="Previous image"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <img
          ref={imageRef}
          key={current.src}
          src={current.src}
          alt={current.alt}
          className={styles.image}
          draggable={false}
          onClick={stopClick}
          onPointerDown={handleImagePointerDown}
          onPointerUp={handleImagePointerUp}
          onPointerCancel={() => {
            pointerOnImageRef.current = false;
          }}
        />

        {hasMany && (
          <button
            type="button"
            className={`${styles.nav} ${styles.navNext}`}
            onClick={(e) => {
              stopClick(e);
              goNext();
            }}
            aria-label="Next image"
          >
            <ChevronRight size={22} />
          </button>
        )}

        {hasMany && (
          <span className={styles.counter} onClick={stopClick} aria-live="polite">
            {index + 1} / {images.length}
          </span>
        )}
      </div>

      <button
        type="button"
        className={styles.close}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
      >
        <X size={20} />
      </button>
    </div>
  );
}
