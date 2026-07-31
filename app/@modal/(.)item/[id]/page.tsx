import { notFound } from "next/navigation";
import { getMenuItemById } from "@/lib/menu/get-menu";
import { ItemModal } from "@/components/menu/ItemModal";

export const revalidate = 60;

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
