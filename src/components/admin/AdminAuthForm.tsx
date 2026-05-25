"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import Logo from "@/components/Logo";
import styles from "@/styles/auth.module.scss";

type AuthMode = "login" | "forgot" | "reset";

interface AdminAuthFormProps {
  mode: AuthMode;
  resetToken?: string;
}

export default function AdminAuthForm({ mode, resetToken }: AdminAuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const titles: Record<AuthMode, { title: string; desc: string }> = {
    login: { title: "STUDIO ACCESS", desc: "Sign in to manage the AFRESH landing page and shop." },
    forgot: { title: "RESET PASSWORD", desc: "Enter your studio email and we will send reset instructions." },
    reset: { title: "NEW PASSWORD", desc: "Choose a new password for your studio account." },
  };

  const { title, desc } = titles[mode];

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign in failed");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setDevResetUrl("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }
      setMessage(data.message);
      if (data.resetUrl) setDevResetUrl(data.resetUrl);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Reset failed");
        return;
      }
      setMessage(data.message);
      setTimeout(() => router.push("/admin/login"), 2000);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authLogo}>
          <Logo size="lg" priority />
        </div>
        <p className={styles.authLabel}>Studio</p>
        <h1 className={styles.authTitle}>{title}</h1>
        <p className={styles.authDesc}>{desc}</p>

        {mode === "login" && (
          <form className={styles.authForm} onSubmit={handleLogin} autoComplete="off">
            <input
              type="text"
              name="prevent_autofill_user"
              className={styles.autofillTrap}
              tabIndex={-1}
              aria-hidden
              autoComplete="username"
              readOnly
            />
            <input
              type="password"
              name="prevent_autofill_pass"
              className={styles.autofillTrap}
              tabIndex={-1}
              aria-hidden
              autoComplete="current-password"
              readOnly
            />
            <div className={styles.field}>
              <label htmlFor="studio-access-email">Email</label>
              <input
                id="studio-access-email"
                name="studio-access-email"
                type="text"
                inputMode="email"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@afreshfashion.com"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="studio-access-password">Password</label>
              <input
                id="studio-access-password"
                name="studio-access-password"
                type="password"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <div className={styles.authLinks}>
              <Link href="/admin/forgot-password" className={styles.textLink}>
                Forgot password?
              </Link>
            </div>
          </form>
        )}

        {mode === "forgot" && (
          <form className={styles.authForm} onSubmit={handleForgot} autoComplete="off">
            <div className={styles.field}>
              <label htmlFor="studio-reset-email">Email</label>
              <input
                id="studio-reset-email"
                name="studio-reset-email"
                type="text"
                inputMode="email"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@afreshfashion.com"
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            {message && <p className={styles.success}>{message}</p>}
            {devResetUrl && (
              <p className={styles.devNote}>
                Dev reset link:{" "}
                <Link href={devResetUrl.startsWith("http") ? new URL(devResetUrl).pathname + new URL(devResetUrl).search : devResetUrl}>
                  Open reset page
                </Link>
              </p>
            )}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <div className={styles.authLinks}>
              <Link href="/admin/login" className={styles.textLink}>
                Back to sign in
              </Link>
            </div>
          </form>
        )}

        {mode === "reset" && (
          <form className={styles.authForm} onSubmit={handleReset} autoComplete="off">
            {!resetToken ? (
              <p className={styles.error}>Missing reset token. Request a new link.</p>
            ) : (
              <>
                <div className={styles.field}>
                  <label htmlFor="studio-new-password">New password</label>
                  <input
                    id="studio-new-password"
                    name="studio-new-password"
                    type="password"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="studio-confirm-password">Confirm password</label>
                  <input
                    id="studio-confirm-password"
                    name="studio-confirm-password"
                    type="password"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                  />
                </div>
              </>
            )}
            {error && <p className={styles.error}>{error}</p>}
            {message && <p className={styles.success}>{message}</p>}
            <button type="submit" className={styles.submitBtn} disabled={loading || !resetToken}>
              {loading ? "Saving…" : "Update password"}
            </button>
            <div className={styles.authLinks}>
              <Link href="/admin/login" className={styles.textLink}>
                Back to sign in
              </Link>
            </div>
          </form>
        )}

        <Link href="/" className={styles.backSite}>
          ← Back to site
        </Link>
      </div>
    </div>
  );
}
