import type { NextConfig } from "next";

/**
 * Next.js 16 — Turbopack is the default for `next dev` and `next build`,
 * so no `--turbopack` flag is needed in package.json scripts.
 */
const nextConfig: NextConfig = {
  // Keep builds strict — a type error must fail CI, never ship silently.
  typescript: { ignoreBuildErrors: false },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // HSTS only matters where HTTPS is served (production hosting).
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
