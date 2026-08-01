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
    // Next's default deviceSizes tops out at 2048/3840 for hero-banner
    // sized images. Nothing on this site ever renders an image wider
    // than the item detail view (capped around 36rem/576px CSS width),
    // so even at 3x DPR that's ~1728px physical, comfortably under
    // 1920. Capping here shrinks the largest tier `fill`-mode images
    // fall back to on their plain `src` attribute (browsers without
    // srcset support, or non-JS crawlers use this; real browsers use
    // srcset+sizes and already request far smaller variants).
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
};

export default nextConfig;
