import { NextResponse } from "next/server";

/** Avoid leaking DB/stack details to clients in production. */
export function apiErrorResponse(err: unknown, fallback: string, status = 500) {
  console.error(err);
  const message =
    process.env.NODE_ENV === "development" && err instanceof Error ? err.message : fallback;
  return NextResponse.json({ error: message }, { status });
}
