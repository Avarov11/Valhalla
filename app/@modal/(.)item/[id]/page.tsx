import { ItemModal } from "@/components/menu/ItemModal";

export const revalidate = 60;

/**
 * REVERTED (2026-08-01): this briefly had generateStaticParams, same as
 * app/item/[id]/page.tsx, to fix every card tap doing a live Supabase
 * round trip. It genuinely did fix that in a local production build
 * (next start), but on Vercel specifically it broke interception: any
 * request carrying a Next-Url header (which is how the client router
 * resolves "what does this route look like when reached as an
 * interception from X", sent on both prefetch AND the real
 * click-triggered navigation) 404'd, verified directly against the
 * deployed site and confirmed absent in an identical local next-start
 * build, so this is Vercel's serving layer for static+intercepted
 * routes specifically, not our code or this Next.js version. A
 * statically prerendered page is baked for one tree shape; interception
 * needs the server to compute an alternate shape per request, which a
 * fully static route can't do once Vercel serves it from its CDN layer
 * instead of invoking the function. Left dynamic here on purpose. The
 * standalone page doesn't have this problem (no interception, no
 * Next-Url dependency) and keeps its own generateStaticParams.
 *
 * NO Supabase call here (2026-08-01): this used to call getMenuItemById
 * on every tap, a real ~176-351ms server-side round trip, which turned
 * out to be the actual "lag" a production report traced back to, not
 * this route's staying dynamic per the note above. It doesn't need to:
 * the tapped item's full data is already loaded client-side (the same
 * menu the grid rendered it from), so ItemModal reads it from
 * MenuProvider (lib/menu/menu-context.tsx) instead. This route now does
 * zero external I/O, just resolving the id and handing it off; the
 * remaining server hop is Next's own interception resolution, not a
 * database round trip.
 */
export default async function InterceptedItemModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ItemModal id={id} />;
}
