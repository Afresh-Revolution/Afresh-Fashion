"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import {
  detectInstallPlatform,
  isInstallSnoozed,
  isPwaInstalledMarked,
  markPwaInstalled,
  snoozeInstallPrompt,
  type InstallPlatform,
} from "@/lib/pwa";
import styles from "@/styles/pwa.module.scss";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("other");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isPwaInstalledMarked() || isInstallSnoozed()) return;

    setPlatform(detectInstallPlatform());

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      markPwaInstalled();
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);

    const timer = window.setTimeout(() => {
      if (!isPwaInstalledMarked() && !isInstallSnoozed()) {
        setVisible(true);
      }
    }, 2400);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        markPwaInstalled();
        setVisible(false);
      }
      setDeferred(null);
      return;
    }
    if (platform === "ios") return;
  }, [deferred, platform]);

  const dismiss = () => {
    snoozeInstallPrompt(3);
    setVisible(false);
  };

  if (!visible || isPwaInstalledMarked()) return null;

  const ios = platform === "ios";
  const canNativeInstall = Boolean(deferred);

  return (
    <aside className={styles.install} role="dialog" aria-label="Install AfrESH Fashion app">
      <div className={styles.installHeader}>
        <span className={styles.installTitle}>Install AfrESH Fashion</span>
        <button type="button" className={styles.installClose} onClick={dismiss} aria-label="Dismiss">
          ×
        </button>
      </div>
      <p className={styles.installText}>
        {ios ? (
          <>
            Add AfrESH Fashion to your home screen: tap <Share size={12} style={{ display: "inline", verticalAlign: "middle" }} />{" "}
            Share, then <strong>Add to Home Screen</strong>.
          </>
        ) : canNativeInstall ? (
          "Install the app for faster access, full-screen browsing, and offline support."
        ) : (
          "Install AfrESH Fashion from your browser menu — look for Install app, Add to Home screen, or Add to Dock."
        )}
      </p>
      <div className={styles.installActions}>
        {canNativeInstall && (
          <button type="button" className={styles.installBtn} onClick={() => void install()}>
            <Download size={12} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Install
          </button>
        )}
        <button type="button" className={styles.installLater} onClick={dismiss}>
          Not now
        </button>
      </div>
    </aside>
  );
}
