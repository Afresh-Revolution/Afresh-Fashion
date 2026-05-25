"use client";

import { useSerwist } from "@serwist/next/react";
import { useEffect, useRef } from "react";
export default function PwaUpdateHandler() {
  const { serwist } = useSerwist();
  const hadController = useRef(Boolean(navigator.serviceWorker?.controller));

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;

    const onControllerChange = () => {
      if (!hadController.current) {
        hadController.current = true;
        return;
      }
      window.location.reload();
    };

    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  useEffect(() => {
    if (!serwist || process.env.NODE_ENV === "development") return;

    const onWaiting = () => {
      void serwist.messageSkipWaiting();
    };

    serwist.addEventListener("waiting", onWaiting);

    const check = () => {
      void serwist.update();
    };

    check();
    const interval = window.setInterval(check, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      serwist.removeEventListener("waiting", onWaiting);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [serwist]);

  return null;
}
