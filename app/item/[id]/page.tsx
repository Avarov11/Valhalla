import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { getMenu } from "@/lib/menu/get-menu";
import { findItemById } from "@/lib/menu/find-item";
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
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const menu = await getMenu();
  const item = findItemById(menu, id);
  if (!item) return { title: "Item not found - Valhalla" };

  return {
    title: `${item.name_en} - Valhalla`,
    description: item.description ?? `${item.name_en} from Valhalla, Hall of Chimney Cakes.`,
    openGraph: item.image_url ? { images: [{ url: item.image_url }] } : undefined,
  };
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const menu = await getMenu();
  const item = findItemById(menu, id);

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
