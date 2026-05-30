import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/require-admin";
import { apiErrorResponse } from "@/lib/safe-api-error";

export function adminError(err: unknown) {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return apiErrorResponse(err, "Server error", 500);
}
