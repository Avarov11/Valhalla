import { notFound } from "next/navigation";
import { getMenu } from "@/lib/menu/get-menu";
import { findItemById } from "@/lib/menu/find-item";
import { ItemModal } from "@/components/menu/ItemModal";

export const revalidate = 60;

export default async function InterceptedItemModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const menu = await getMenu();
  const item = findItemById(menu, id);

  if (!item) notFound();

  return <ItemModal item={item} />;
}
