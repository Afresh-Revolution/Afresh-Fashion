import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

function getRevision() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" });
  return result.stdout?.trim() || `build-${Date.now()}`;
}

const revision = getRevision();

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default withSerwist(nextConfig);
