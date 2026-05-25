"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PRODUCT_CAROUSEL_INTERVAL_MS,
  productCarouselPhaseMs,
  resolveProductImageUrls,
} from "@/lib/product-carousel";
import styles from "@/styles/product-carousel.module.scss";

type Props = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  imageUrls?: string[];
  resolveSrc: (slug: string, url: string | null, w: number, h: number) => string;
};

export default function ProductImageCarousel({
  productId,
  slug,
  name,
  imageUrl,
  imageUrls,
  resolveSrc,
}: Props) {
  const sources = useMemo(() => {
    const urls = resolveProductImageUrls(imageUrl, imageUrls);
    return urls.map((url) => resolveSrc(slug, url, 400, 530));
  }, [slug, imageUrl, imageUrls, resolveSrc]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [productId, sources.length]);

  useEffect(() => {
    if (sources.length <= 1) return;

    const phase = productCarouselPhaseMs(productId);
    let interval: ReturnType<typeof setInterval> | undefined;

    const startTimer = window.setTimeout(() => {
      interval = setInterval(() => {
        setIndex((i) => (i + 1) % sources.length);
      }, PRODUCT_CAROUSEL_INTERVAL_MS);
    }, phase);

    return () => {
      window.clearTimeout(startTimer);
      if (interval) clearInterval(interval);
    };
  }, [productId, sources.length]);

  if (sources.length === 0) {
    return (
      <img
        src={resolveSrc(slug, null, 400, 530)}
        alt={name}
        className={`product-img ${styles.slide}`}
      />
    );
  }

  if (sources.length === 1) {
    return <img src={sources[0]} alt={name} className={`product-img ${styles.slide}`} />;
  }

  return (
    <div className={`product-carousel ${styles.carousel}`} aria-label={`${name} gallery`}>
      {sources.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt={i === 0 ? name : `${name} view ${i + 1}`}
          className={`product-img ${styles.slide} ${i === index ? styles.slideActive : ""}`}
          aria-hidden={i !== index}
        />
      ))}
      <div className={styles.dots} aria-hidden="true">
        {sources.map((_, i) => (
          <span key={i} className={`${styles.dot} ${i === index ? styles.dotActive : ""}`} />
        ))}
      </div>
    </div>
  );
}
