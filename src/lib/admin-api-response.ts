import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/require-admin";

export function adminError(err: unknown) {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error(err);
  return NextResponse.json(
    { error: err instanceof Error ? err.message : "Server error" },
    { status: 500 }
  );
}
