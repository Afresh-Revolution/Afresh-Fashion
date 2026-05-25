import type { Metadata } from "next";
import AdminAuthForm from "@/components/admin/AdminAuthForm";

export const metadata: Metadata = {
  title: "Reset password — AFRESH Studio",
  robots: "noindex, nofollow",
};

export default async function AdminResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <AdminAuthForm mode="reset" resetToken={params.token} />;
}
