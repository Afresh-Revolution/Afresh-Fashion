"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function CompleteInner() {
  const params = useSearchParams();
  const reference = params.get("reference");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("Missing payment reference.");
      return;
    }
    fetch("/api/orders/paystack/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStatus("ok");
        setMessage(`Order ${data.order?.order_number ?? ""} paid successfully.`);
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Verification failed");
      });
  }, [reference]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        color: "#F5F5F5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      {status === "loading" && <p>Confirming your payment…</p>}
      {status === "ok" && (
        <>
          <h1 style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.1em", marginBottom: "1rem" }}>
            Thank you ✦
          </h1>
          <p style={{ color: "#BFC0C0", marginBottom: "2rem" }}>{message}</p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 style={{ marginBottom: "1rem" }}>Payment issue</h1>
          <p style={{ color: "#e8a0a0", marginBottom: "2rem" }}>{message}</p>
        </>
      )}
      <Link href="/" style={{ color: "#C8A96B", letterSpacing: "0.15em", textTransform: "uppercase", fontSize: "11px" }}>
        Back to AFRESH
      </Link>
    </main>
  );
}

export default function OrderCompletePage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", background: "#0A0A0A" }} />}>
      <CompleteInner />
    </Suspense>
  );
}
