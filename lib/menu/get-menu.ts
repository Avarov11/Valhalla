import { createAnonClient } from "@/lib/supabase/server";
import type { Menu } from "@/lib/menu/types";

/**
 * The whole catalogue in one query with two joins, fetched once at the
 * page level and passed down. RLS does the filtering: categories comes
 * back is_active-only, menu_items and item_sizes come back complete
 * (including unavailable items, which the UI renders dimmed rather than
 * hiding, see CLAUDE.md).
 *
 * TODO: five categories the old site advertises in its nav render empty
 * there and are intentionally not in this database at all: New Items,
 * Offers, Sundae, Custom Cone Build, Custom Classic Build. menu.json's
 * own `categories` array never defines them (see its `emptyOnLiveSite`
 * field), so there is no real content to seed and nothing was invented
 * here. New Items / Offers / Sundae are ordinary categories once there
 * are real items and prices for them, seed them like any other category.
 * Custom Cone Build / Custom Classic Build are a different scope
 * entirely: an interactive product configurator (choose a cone base,
 * breading, spread, ice cream, toppings, with a live running price),
 * which needs its own data model for option groups and prices, its own
 * UI flow, and a cart line shape that isn't "one catalog item, one
 * price" like every other line today. Raised with the owner, not built.
 */
export async function getMenu(): Promise<Menu> {
  const supabase = createAnonClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*, menu_items(*, item_sizes(*))")
    .order("sort_order")
    .order("sort_order", { referencedTable: "menu_items" })
    .order("sort_order", { referencedTable: "menu_items.item_sizes" });

  if (error) {
    throw new Error(`Failed to fetch menu: ${error.message}`);
  }

  return data as unknown as Menu;
}
