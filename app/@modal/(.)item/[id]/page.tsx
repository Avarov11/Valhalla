import { notFound } from "next/navigation";
import { getMenu, getMenuItemById } from "@/lib/menu/get-menu";
import { ItemModal } from "@/components/menu/ItemModal";

export const revalidate = 60;

/**
 * Without this, every card tap from the grid hit this route live: a
 * server render plus a real Supabase round trip on every single click,
 * the same "ƒ Dynamic" problem app/item/[id]/page.tsx already had fixed
 * once (see that file's own comment) but this sibling route never got.
 * This is actually the more important of the two to prebuild, since
 * this is what fires on the normal in-app browsing flow (tapping a
 * card), not just a direct link or refresh.
 */
export async function generateStaticParams() {
  const menu = await getMenu();
  return menu.flatMap((category) => category.menu_items.map((item) => ({ id: item.id })));
}

export default async function InterceptedItemModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getMenuItemById(id);

  if (!item) notFound();

  return <ItemModal item={item} />;
}
