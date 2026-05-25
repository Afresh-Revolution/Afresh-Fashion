import { NextResponse } from "next/server";
import { processVipSignup } from "@/lib/vip";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
