import type { Menu, MenuItemRow } from "@/lib/menu/types";

export function findItemById(menu: Menu, id: string): MenuItemRow | null {
  for (const category of menu) {
    const found = category.menu_items.find((item) => item.id === id);
    if (found) return found;
  }
  return null;
}
