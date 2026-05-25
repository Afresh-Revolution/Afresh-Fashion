"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { resolveImage } from "@/hooks/useSiteContent";
import type { HeroSection as HeroContent } from "@/types/content";
import styles from "@/styles/home.module.scss";

const SLIDE_INTERVAL_MS = 5000;

type Props = {
  hero: HeroContent;
  onNavigate: (href: string) => void;
};

function buildBackgrounds(hero: HeroContent): string[] {
  const fromDb = hero.background_urls?.filter(Boolean) ?? [];
  if (fromDb.length > 0) return fromDb;
  if (hero.background_url) return [hero.background_url];
  return [resolveImage("afresh-hero-dark", null, 1920, 1080)];
}

export default function HeroSection({ hero, onNavigate }: Props) {
  const titleChars = hero.title.split("");
  const backgrounds = useMemo(() => buildBackgrounds(hero), [hero]);
  const backgroundsKey = backgrounds.join("|");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [backgroundsKey]);

  useEffect(() => {
    if (backgrounds.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % backgrounds.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [backgrounds.length]);

  return (
    <section id="hero" className={styles.hero} aria-label="Afresh hero">
      <div className={styles.heroStage}>
        <div className={styles.heroImageWrap} id="heroImageWrap">
          <div className={styles.heroImageStack}>
            {backgrounds.map((url, i) => (
              <img
                key={`${url}-${i}`}
                src={url}
                alt=""
                className={`${styles.heroImageSlide} ${i === activeIndex ? styles.heroImageSlideActive : ""} ${
                  i === activeIndex ? "hero-bg" : ""
                }`}
              />
            ))}
          </div>
        </div>
        <div className={styles.heroVignette} aria-hidden />
        <div className={styles.heroAurora} aria-hidden />
        <div className={styles.heroGrid} aria-hidden />
        <div id="heroParticles" className={styles.heroParticles} aria-hidden />
      </div>

      <div className={styles.heroFrame} aria-hidden>
        <span className={styles.heroCorner} data-pos="tl" />
        <span className={styles.heroCorner} data-pos="tr" />
        <span className={styles.heroCorner} data-pos="bl" />
        <span className={styles.heroCorner} data-pos="br" />
      </div>

      <div className={styles.heroHudTop}>
        <span className={styles.heroHudLive}>
          <span className={styles.heroHudDot} />
          Live
        </span>
        <span className={styles.heroHudSeason}>{hero.side_label}</span>
        {backgrounds.length > 1 && (
          <span className={styles.heroSlideCount} aria-live="polite">
            {String(activeIndex + 1).padStart(2, "0")} / {String(backgrounds.length).padStart(2, "0")}
          </span>
        )}
      </div>

      <div className={styles.heroContent} id="heroContent">
        <p className={`${styles.heroTagline} hero-fade`} style={{ opacity: 0 }}>
          <span className={styles.heroTaglineAccent} aria-hidden />
          {hero.tagline}
        </p>

        <div className={styles.heroTitleBlock}>
          <div className={styles.heroOrbit} aria-hidden>
            <span className={styles.heroOrbitRing} />
            <span className={styles.heroOrbitCore} />
          </div>
          <h1 className={styles.heroTitle} aria-label={hero.title}>
            <span className={styles.heroTitleGhost} aria-hidden>
              {titleChars.map((char, i) => (
                <span key={`g-${char}-${i}`}>{char === " " ? "\u00A0" : char}</span>
              ))}
            </span>
            <span className={styles.heroTitleMain}>
              {titleChars.map((char, i) => (
                <span key={`${char}-${i}`} className="hero-title-char" style={{ opacity: 0 }}>
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </span>
          </h1>
        </div>

        <p className={`${styles.heroSubtitle} hero-fade`} style={{ opacity: 0 }}>
          {hero.subtitle}
        </p>

        <div className={`${styles.heroCtas} hero-fade`} style={{ opacity: 0 }}>
          <a
            href={hero.cta_primary_href}
            className={styles.heroCtaPrimary}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(hero.cta_primary_href);
            }}
          >
            <span>{hero.cta_primary_label}</span>
            <span className={styles.heroCtaShine} aria-hidden />
          </a>
          <a
            href={hero.cta_secondary_href}
            className={styles.heroCtaGhost}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(hero.cta_secondary_href);
            }}
          >
            {hero.cta_secondary_label}
          </a>
        </div>

        <div className={`${styles.heroMetrics} hero-fade`} style={{ opacity: 0 }}>
          <div className={styles.heroMetric}>
            <span className={styles.heroMetricValue}>01</span>
            <span className={styles.heroMetricLabel}>Heritage</span>
          </div>
          <div className={styles.heroMetricDivider} aria-hidden />
          <div className={styles.heroMetric}>
            <span className={styles.heroMetricValue}>02</span>
            <span className={styles.heroMetricLabel}>Future</span>
          </div>
          <div className={styles.heroMetricDivider} aria-hidden />
          <div className={styles.heroMetric}>
            <span className={styles.heroMetricValue}>∞</span>
            <span className={styles.heroMetricLabel}>Movement</span>
          </div>
        </div>
      </div>

      <div className={styles.heroBottom}>
        <div className={styles.heroSide}>
          <div className={styles.heroSideLine} />
          <span>{hero.side_label}</span>
          <div className={styles.heroSideLine} />
        </div>
        <div className={`${styles.heroScroll} scroll-indicator`}>
          <span>{hero.scroll_label}</span>
          <ChevronDown size={16} />
        </div>
        <p className={styles.heroCoords}>AFRESH · GLOBAL</p>
      </div>
    </section>
  );
}
