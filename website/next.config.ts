import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence the multi-lockfile workspace-root warning (root lockfile + website lockfile).
  // Next 16 does not run ESLint during `next build` (it gates on TypeScript only), so the
  // legacy `no-explicit-any` debt in the original API clients does not block builds/deploys.
  // Run `npx eslint .` separately for the lint signal.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
