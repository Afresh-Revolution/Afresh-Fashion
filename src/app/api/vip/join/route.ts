import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api-security";
import { processVipSignup } from "@/lib/vip";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{ email?: string }>(request, 4096);
    const email = String(body.email || "").trim().toLowerCase();

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const result = await processVipSignup(email, request);

    return NextResponse.json({
      ok: true,
      email: result.email,
      isNew: result.isNew,
      message: result.isNew
        ? "Welcome to the Inner Circle ✦"
        : "You're already on the list ✦",
    });
  } catch (err) {
    console.error("VIP join error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not complete signup" },
      { status: 500 }
    );
  }
}
