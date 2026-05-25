import { Suspense } from "react";
import type { Metadata } from "next";
import AdminAuthForm from "@/components/admin/AdminAuthForm";

export const metadata: Metadata = {
  title: "Forgot password — AFRESH Studio",
  robots: "noindex, nofollow",
};

export default function AdminForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <AdminAuthForm mode="forgot" />
    </Suspense>
  );
}
