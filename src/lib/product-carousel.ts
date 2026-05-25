/** Stagger carousel start so multi-image cards do not flip in sync (3s interval). */
export function productCarouselPhaseMs(productId: string): number {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash * 31 + productId.charCodeAt(i)) >>> 0;
  }
  return hash % 3000;
}

export const PRODUCT_CAROUSEL_INTERVAL_MS = 3000;

export function resolveProductImageUrls(imageUrl: string | null, imageUrls?: string[]): string[] {
  if (imageUrls?.length) return imageUrls;
  if (imageUrl) return [imageUrl];
  return [];
}
