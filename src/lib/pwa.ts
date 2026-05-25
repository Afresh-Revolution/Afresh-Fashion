export const PWA_INSTALLED_KEY = "afresh_pwa_installed";
export const PWA_INSTALL_SNOOZE_KEY = "afresh_pwa_install_snooze_until";

export type InstallPlatform = "chromium" | "ios" | "other";

export function isPwaMode(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    nav.standalone === true
  );
}

export function markPwaInstalled(): void {
  try {
    localStorage.setItem(PWA_INSTALLED_KEY, "1");
    localStorage.removeItem(PWA_INSTALL_SNOOZE_KEY);
  } catch {
    /* ignore */
  }
}

export function isPwaInstalledMarked(): boolean {
  if (isPwaMode()) {
    markPwaInstalled();
    return true;
  }
  try {
    return localStorage.getItem(PWA_INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function isInstallSnoozed(): boolean {
  try {
    const until = Number(localStorage.getItem(PWA_INSTALL_SNOOZE_KEY) ?? "0");
    return until > Date.now();
  } catch {
    return false;
  }
}

export function snoozeInstallPrompt(days = 3): void {
  try {
    localStorage.setItem(PWA_INSTALL_SNOOZE_KEY, String(Date.now() + days * 86400000));
  } catch {
    /* ignore */
  }
}

export function detectInstallPlatform(): InstallPlatform {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/Chrome|Chromium|Edg|OPR|SamsungBrowser/.test(ua) && "BeforeInstallPromptEvent" in window) {
    return "chromium";
  }
  return "other";
}

export function shouldOfferPullToRefresh(pathname: string): boolean {
  if (pathname.startsWith("/~offline")) return false;
  return (
    pathname === "/" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/order/")
  );
}
