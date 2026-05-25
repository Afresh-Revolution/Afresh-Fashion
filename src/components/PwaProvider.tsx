"use client";

import { SerwistProvider } from "@serwist/next/react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import PwaPullToRefresh from "@/components/PwaPullToRefresh";
import PwaUpdateHandler from "@/components/PwaUpdateHandler";
import { isPwaMode } from "@/lib/pwa";

function PwaDocumentAttributes() {
  useEffect(() => {
    const sync = () => {
      if (isPwaMode()) {
        document.documentElement.setAttribute("data-pwa", "");
      } else {
        document.documentElement.removeAttribute("data-pwa");
      }
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  return null;
}

export default function PwaProvider({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/sw.js"
      disable={process.env.NODE_ENV === "development"}
      register
      reloadOnOnline
    >
      <PwaDocumentAttributes />
      <PwaUpdateHandler />
      <PwaPullToRefresh />
      {children}
      <PwaInstallPrompt />
    </SerwistProvider>
  );
}
