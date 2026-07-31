import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { getMenu, getMenuItemById } from "@/lib/menu/get-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ItemDetailContent } from "@/components/menu/ItemDetailContent";

export const revalidate = 60;

/**
 * The real page behind /item/[id]: reachable directly (refresh, a shared
 * WhatsApp link, a search engine), not only as the modal intercepted from
 * the grid at app/@modal/(.)item/[id]. Deliberately light chrome, a back
 * link and the theme toggle, rather than the full header and hero, since
 * someone landing here from a shared link is looking at one item, not
 * browsing the catalogue.
 *
 * Without generateStaticParams, a dynamic segment with no enumerated
 * params builds as fully server-rendered on every single request (the
 * "ƒ Dynamic" marker in `next build`'s output), paying a live Supabase
 * round trip (~400ms to eu-west-1, measured directly) every time, ISR's
 * revalidate alone doesn't turn that into a cached static response.
 * With a known, bounded set (134 items) enumerating them here instead
 * makes every item page a real static file at build time, ISR-revalidated
 * every 60s same as before, cutting steady-state response to roughly what
 * the homepage already gets rather than a fresh render each visit.
 */
export async function generateStaticParams() {
  const menu = await getMenu();
  return menu.flatMap((category) => category.menu_items.map((item) => ({ id: item.id })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getMenuItemById(id);
  if (!item) return { title: "Item not found - Valhalla" };

  return {
    title: `${item.name_en} - Valhalla`,
    description: item.description ?? `${item.name_en} from Valhalla, Hall of Chimney Cakes.`,
    openGraph: item.image_url ? { images: [{ url: item.image_url }] } : undefined,
  };
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getMenuItemById(id);

  if (!item) notFound();

  return (
    <div className="mx-auto min-h-dvh max-w-xl bg-(--bg-page)">
      <div className="flex h-(--header-height) items-center justify-between border-b border-(--border-default) px-4">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-1 rounded-(--radius-pill) px-2 text-(length:--text-sm) font-medium text-(--text-secondary) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover)"
        >
          <CaretLeft size={16} />
          Back to menu
        </Link>
        <ThemeToggle />
      </div>

      <ItemDetailContent item={item} />
    </div>
  );
}
