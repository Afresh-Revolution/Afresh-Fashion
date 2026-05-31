import type { PointerEvent } from "react";
import type { LightboxImage, LightboxState } from "@/components/ImageLightbox";
import { resolveImage } from "@/hooks/useSiteContent";

export function fullImageSrc(seed: string, url: string | null | undefined) {
  return resolveImage(seed, url, 1920, 1920);
}

export function singleLightboxImage(
  seed: string,
  url: string | null | undefined,
  alt: string,
): LightboxImage {
  return { src: fullImageSrc(seed, url), alt };
}

export function openLightbox(
  images: LightboxImage[],
  index = 0,
): LightboxState {
  if (images.length === 0) return null;
  return { images, index: Math.min(index, images.length - 1) };
}

/** Ignore click when the pointer moved enough to count as a drag (e.g. lookbook scroll). */
export function createClickGuard() {
  let active = false;
  let moved = false;
  let startX = 0;
  let startY = 0;

  return {
    onPointerDown(e: PointerEvent) {
      active = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
    },
    onPointerMove(e: PointerEvent) {
      if (!active) return;
      if (Math.abs(e.clientX - startX) > 8 || Math.abs(e.clientY - startY) > 8) {
        moved = true;
      }
    },
    onPointerUp() {
      active = false;
    },
    wasDrag() {
      return moved;
    },
  };
}
