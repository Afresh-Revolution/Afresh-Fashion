"use client";

import { SerwistProvider } from "@serwist/next/react";
import type { ReactNode } from "react";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import PwaPullToRefresh from "@/components/PwaPullToRefresh";
import PwaUpdateHandler from "@/components/PwaUpdateHandler";

export default function PwaProvider({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/sw.js"
      disable={process.env.NODE_ENV === "development"}
      register
      reloadOnOnline
    >
      <PwaUpdateHandler />
      <PwaPullToRefresh />
      {children}
      <PwaInstallPrompt />
    </SerwistProvider>
  );
}
