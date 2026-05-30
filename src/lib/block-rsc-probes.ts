import type { NextRequest } from "next/server";

/** Headers used in known Next.js / RSC exploit chains (CVE-2025-66478, CVE-2025-29927). */
const BLOCKED_REQUEST_HEADERS = [
  "x-middleware-subrequest",
  "x-middleware-request-id",
  "x-nextjs-data",
] as const;

/**
 * This app does not use Server Actions. Block RSC action probes that target
 * React Flight deserialization (React2Shell / CVE-2025-66478).
 */
export function isRscExploitProbe(request: NextRequest): boolean {
  if (request.headers.get("next-action")) return true;
  if (request.headers.get("rsc-action-id")) return true;

  for (const name of BLOCKED_REQUEST_HEADERS) {
    if (request.headers.get(name)) return true;
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (
    request.method === "POST" &&
    contentType.includes("multipart/form-data") &&
    request.headers.has("next-router-state-tree") &&
    !request.nextUrl.pathname.startsWith("/api/")
  ) {
    return true;
  }

  return false;
}
