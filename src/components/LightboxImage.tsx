"use client";

import { resolveImage } from "@/hooks/useSiteContent";
import type { LightboxState } from "@/components/ImageLightbox";
import { createClickGuard, openLightbox, singleLightboxImage } from "@/lib/lightbox";
import lightboxStyles from "@/styles/image-lightbox.module.scss";

type ClickGuard = ReturnType<typeof createClickGuard>;

type Props = {
  seed: string;
  url: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  className?: string;
  onOpen: (state: LightboxState) => void;
  /** When set, opens a multi-image lightbox (e.g. product carousel). */
  gallery?: { seed: string; url: string | null; alt: string }[];
  galleryIndex?: number;
  clickGuard?: ClickGuard;
};

export function LightboxImage({
  seed,
  url,
  alt,
  width,
  height,
  className,
  onOpen,
  gallery,
  galleryIndex = 0,
  clickGuard,
}: Props) {
  const guard = clickGuard ?? createClickGuard();

  const handleOpen = () => {
    if (guard.wasDrag()) return;

    if (gallery && gallery.length > 0) {
      onOpen(
        openLightbox(
          gallery.map((item, i) => singleLightboxImage(item.seed, item.url, item.alt || `${alt} ${i + 1}`)),
          galleryIndex,
        )!,
      );
      return;
    }

    onOpen(openLightbox([singleLightboxImage(seed, url, alt)])!);
  };

  return (
    <img
      src={resolveImage(seed, url, width, height)}
      alt={alt}
      className={`${className ?? ""} ${lightboxStyles.clickable}`.trim()}
      onClick={handleOpen}
      onPointerDown={guard.onPointerDown}
      onPointerMove={guard.onPointerMove}
      onPointerUp={guard.onPointerUp}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpen();
        }
      }}
    />
  );
}
