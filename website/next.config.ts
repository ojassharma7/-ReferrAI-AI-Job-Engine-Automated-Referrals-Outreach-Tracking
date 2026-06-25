import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app (a parent lockfile exists for the CLI in
  // src/). Using outputFileTracingRoot keeps Vercel's file tracing consistent and
  // avoids the "turbopack.root != outputFileTracingRoot" conflict on Vercel.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
