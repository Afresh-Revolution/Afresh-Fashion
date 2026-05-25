import { Suspense } from "react";
import type { Metadata } from "next";
import AdminAuthForm from "@/components/admin/AdminAuthForm";

export const metadata: Metadata = {
  title: "Sign in — AFRESH Studio",
  robots: "noindex, nofollow",
};

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminAuthForm mode="login" />
    </Suspense>
  );
}
