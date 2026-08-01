import path from "node:path";
import type { NextConfig } from "next";

const supabaseHostname = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://epcbdgamvqvbiooinvvs.supabase.co",
).hostname;

const nextConfig: NextConfig = {
  // This project lives nested inside the main Valhalla repo (see
  // CLAUDE.md, Admin dashboard) and has its own package-lock.json.
  // Without this, Next's workspace-root inference gets confused by the
  // parent project's lockfile one level up and warns about it on every
  // build; pinning the root here to exactly this directory is the fix
  // Next's own warning recommends.
  outputFileTracingRoot: path.join(__dirname),
  // Same reasoning as the main site's next.config.ts: @phosphor-icons/react's
  // barrel export pulls in every icon otherwise, this rewrites imports to
  // their specific submodule at compile time instead.
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Admin only ever renders small thumbnails (48px in the product
    // list), nowhere near the main site's 1920 cap.
    deviceSizes: [128, 256, 384, 640],
  },
};

export default nextConfig;
