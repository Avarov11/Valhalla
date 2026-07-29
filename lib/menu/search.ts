import type { Menu, Category } from "@/lib/menu/types";

/**
 * Matches item name, item description, and both the English and Arabic
 * category names. If the category itself matches, every item under it
 * shows (that's how an Arabic query like "قهوة" surfaces every coffee
 * item even though item names and descriptions are English only).
 * Otherwise only the items that themselves match survive, and a
 * category with zero surviving items is dropped entirely.
 */
export function filterMenu(menu: Menu, query: string): Menu {
  const trimmed = query.trim();
  if (!trimmed) return menu;

  const lower = trimmed.toLowerCase();

  return menu.reduce<Menu>((acc, category) => {
    const categoryMatches =
      category.name_en.toLowerCase().includes(lower) || category.name_ar.includes(trimmed);

    if (categoryMatches) {
      acc.push(category);
      return acc;
    }

    const matchingItems = category.menu_items.filter(
      (item) =>
        item.name_en.toLowerCase().includes(lower) ||
        (item.description?.toLowerCase().includes(lower) ?? false),
    );

    if (matchingItems.length > 0) {
      acc.push({ ...category, menu_items: matchingItems } satisfies Category);
    }

    return acc;
  }, []);
}
