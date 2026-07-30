import type { NextConfig } from "next";

const supabaseHostname = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://epcbdgamvqvbiooinvvs.supabase.co",
).hostname;

const nextConfig: NextConfig = {
  // @phosphor-icons/react ships ~3000 individual icon files behind one
  // barrel export. Dev-mode webpack doesn't tree-shake the way a
  // production build does, so a plain `import { X } from
  // "@phosphor-icons/react"` was pulling the whole package into the
  // compile graph (14k+ modules for what uses maybe 15 icons total).
  // This rewrites those imports to their specific submodule at compile
  // time instead.
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
  },
};

export default nextConfig;
