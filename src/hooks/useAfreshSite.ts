"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function useAfreshSite() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [navSolid, setNavSolid] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [countdown, setCountdown] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [memberEmail, setMemberEmail] = useState("");
  const dropDateRef = useRef<Date | null>(null);
  const animationsReady = useRef(false);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    const t = setTimeout(() => setToastVisible(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const addToCart = useCallback(
    (product: string) => {
      setCartCount((c) => {
        const next = c + 1;
        const badge = document.querySelector("#cartBtn span");
        if (badge) {
          gsap.fromTo(badge, { scale: 1.5 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
        }
        return next;
      });
      showToast(`${product} added to bag`);
    },
    [showToast]
  );

  const joinVIP = useCallback(async () => {
    const email = memberEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      showToast("Please enter a valid email address");
      return;
    }
    try {
      const res = await fetch("/api/vip/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not join VIP");
        return;
      }
      showToast(data.message || "Welcome to the Inner Circle ✦");
      setMemberEmail("");
    } catch {
      showToast("Something went wrong — try again");
    }
  }, [memberEmail, showToast]);

  const submitContact = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      showToast("Message sent — we'll be in touch ✦");
      (e.target as HTMLFormElement).reset();
    },
    [showToast]
  );

  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const scrollTo = useCallback((id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    closeMenu();
  }, [closeMenu]);

  // Preloader + GSAP init
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const preloader = document.getElementById("preloader");
    const preloaderLetters = document.querySelectorAll(".preloader-brand span");
    const preloaderFashion = document.querySelector(".preloader-fashion");
    const preloaderLine = document.querySelector(".preloader-line");

    const initAnimations = () => {
      if (animationsReady.current) return;
      animationsReady.current = true;

      gsap.to(".hero-title", { opacity: 1, duration: 1.2, ease: "power3.out" });
      gsap.to(".hero-fade", { opacity: 1, duration: 1, stagger: 0.2, delay: 0.5, ease: "power2.out" });

      gsap.to("#hero", {
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
        y: 150,
        opacity: 0.3,
      });

      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
        });
      });

      gsap.utils.toArray<HTMLElement>(".reveal-left").forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
        });
      });

      gsap.utils.toArray<HTMLElement>(".reveal-right").forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
        });
      });

      gsap.utils.toArray<HTMLElement>(".reveal-scale").forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
        });
      });

      gsap.utils.toArray<HTMLElement>(".counter").forEach((counter) => {
        const target = parseInt(counter.dataset.target || "0", 10);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: { trigger: counter, start: "top 85%" },
          onUpdate: () => {
            counter.textContent = String(Math.round(obj.val));
          },
        });
      });

      document.querySelectorAll("#collections .img-zoom").forEach((card) => {
        const img = card.querySelector("img");
        if (img) {
          gsap.to(img, {
            y: -30,
            scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
          });
        }
      });
    };

    const tl = gsap.timeline({
      onComplete: () => {
        if (preloader) {
          gsap.to(preloader, {
            opacity: 0,
            duration: 0.6,
            ease: "power2.inOut",
            onComplete: () => {
              preloader.style.display = "none";
              initAnimations();
            },
          });
        } else {
          initAnimations();
        }
      },
    });

    tl.to(preloaderLetters, { y: 0, duration: 0.8, stagger: 0.08, ease: "power4.out" })
      .to(
        preloaderFashion,
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
        "-=0.35"
      )
      .to(preloaderLine, { width: "80px", duration: 0.8, ease: "power2.inOut" }, "-=0.3")
      .to({}, { duration: 0.8 });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // Custom cursor
  useEffect(() => {
    const dot = document.getElementById("cursorDot");
    const ring = document.getElementById("cursorRing");
    if (!dot || !ring) return;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let rafId = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      gsap.to(dot, { x: mouseX - 3, y: mouseY - 3, duration: 0.1 });
    };

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`;
      rafId = requestAnimationFrame(animateRing);
    };

    document.addEventListener("mousemove", onMove);
    rafId = requestAnimationFrame(animateRing);

    const hoverables = document.querySelectorAll("a, button, .cursor-pointer");
    const onEnter = () => ring.classList.add("hovering");
    const onLeave = () => ring.classList.remove("hovering");
    hoverables.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      hoverables.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  // Navbar scroll
  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hero parallax + particles
  useEffect(() => {
    const hero = document.getElementById("hero");
    const heroContent = document.getElementById("heroContent");
    const particleContainer = document.getElementById("heroParticles");
    if (!hero || !heroContent || !particleContainer) return;

    const onHeroMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      gsap.to(heroContent, { x, y, duration: 1, ease: "power2.out" });
    };
    hero.addEventListener("mousemove", onHeroMove);

    const tweens: gsap.core.Tween[] = [];
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      const size = `${Math.random() * 3 + 1}px`;
      particle.style.width = size;
      particle.style.height = size;
      particle.style.opacity = String(Math.random() * 0.5 + 0.1);
      particleContainer.appendChild(particle);
      tweens.push(
        gsap.to(particle, {
          y: -100 - Math.random() * 200,
          x: (Math.random() - 0.5) * 100,
          opacity: 0,
          duration: 4 + Math.random() * 6,
          repeat: -1,
          delay: Math.random() * 5,
          ease: "none",
        })
      );
    }

    return () => {
      hero.removeEventListener("mousemove", onHeroMove);
      tweens.forEach((t) => t.kill());
      particleContainer.innerHTML = "";
    };
  }, []);

  // Countdown
  useEffect(() => {
    if (!dropDateRef.current) {
      dropDateRef.current = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const tick = () => {
      const diff = (dropDateRef.current?.getTime() || 0) - Date.now();
      if (diff <= 0) {
        setCountdown({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({
        days: d.toString().padStart(2, "0"),
        hours: h.toString().padStart(2, "0"),
        minutes: m.toString().padStart(2, "0"),
        seconds: s.toString().padStart(2, "0"),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Shop filter animation
  useEffect(() => {
    document.querySelectorAll("#shopGrid .product-card").forEach((card) => {
      const el = card as HTMLElement;
      const cat = el.dataset.category;
      const show = activeFilter === "all" || cat === activeFilter;
      if (show) {
        gsap.to(el, { opacity: 1, scale: 1, duration: 0.4, display: "block" });
      } else {
        gsap.to(el, {
          opacity: 0,
          scale: 0.95,
          duration: 0.4,
          onComplete: () => {
            el.style.display = "none";
          },
        });
      }
    });
  }, [activeFilter]);

  // Lookbook drag scroll
  useEffect(() => {
    const el = document.getElementById("lookbookScroll");
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const onUp = () => {
      isDown = false;
    };
    const onMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      el.scrollLeft = scrollLeft - (x - startX) * 1.5;
    };

    el.addEventListener("mousedown", onDown);
    el.addEventListener("mouseleave", onUp);
    el.addEventListener("mouseup", onUp);
    el.addEventListener("mousemove", onMove);
    return () => {
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("mouseleave", onUp);
      el.removeEventListener("mouseup", onUp);
      el.removeEventListener("mousemove", onMove);
    };
  }, []);

  return {
    menuOpen,
    cartCount,
    toastMessage,
    toastVisible,
    navSolid,
    activeFilter,
    setActiveFilter,
    countdown,
    memberEmail,
    setMemberEmail,
    showToast,
    addToCart,
    joinVIP,
    submitContact,
    toggleMenu,
    closeMenu,
    scrollTo,
  };
}
