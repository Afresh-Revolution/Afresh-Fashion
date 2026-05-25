import { NextResponse } from "next/server";
import { getSiteContent } from "@/lib/content";
import { requireAdmin } from "@/lib/require-admin";
import { adminError } from "@/lib/admin-api-response";

export async function GET() {
  try {
    await requireAdmin();
    const content = await getSiteContent();
    return NextResponse.json(content);
  } catch (err) {
    return adminError(err);
  }
}
