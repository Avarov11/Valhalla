import { cache } from "react";
import { createAnonClient } from "@/lib/supabase/server";
import type { Menu, MenuItemRow } from "@/lib/menu/types";

/**
 * The whole catalogue in one query with nested joins (categories ->
 * menu_items -> item_sizes, and menu_items -> item_addon_groups ->
 * item_addon_options), fetched once at the page level and passed down.
 * RLS does the filtering: categories comes back is_active-only,
 * everything else comes back complete (including unavailable items and
 * addon options, which the UI renders dimmed rather than hiding, see
 * CLAUDE.md).
 *
 * Wrapped in React's cache() because both app/layout.tsx (for
 * CartProvider) and app/page.tsx (for the grid) call this for the same
 * "/" request. Without cache(), that's the full 134-item, two-join
 * catalogue fetched from Supabase twice per homepage load; with it,
 * the second call reuses the first call's result, no second round trip.
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
export const getMenu = cache(async (): Promise<Menu> => {
  const supabase = createAnonClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*, menu_items(*, item_sizes(*), item_addon_groups(*, item_addon_options(*)))")
    .order("sort_order")
    .order("sort_order", { referencedTable: "menu_items" })
    .order("sort_order", { referencedTable: "menu_items.item_sizes" })
    .order("sort_order", { referencedTable: "menu_items.item_addon_groups" })
    .order("sort_order", { referencedTable: "menu_items.item_addon_groups.item_addon_options" });

  if (error) {
    throw new Error(`Failed to fetch menu: ${error.message}`);
  }

  return data as unknown as Menu;
});

/**
 * Item detail (the standalone route and its intercepted modal) used to
 * call getMenu() and search the whole catalogue client-side for one id,
 * meaning a single item click fetched and deserialized all 134 items
 * plus their sizes just to throw away everything but one row. This goes
 * straight at menu_items for that one id instead, no categories join
 * needed since MenuItemRow never carries category fields. Same RLS as
 * getMenu(): not gated on is_available, an unavailable item still needs
 * to reach the page so it can render as sold out rather than 404. Also
 * wrapped in cache(): the standalone /item/[id] route calls this from
 * both generateMetadata and the page component in the same request.
 */
export const getMenuItemById = cache(async (id: string): Promise<MenuItemRow | null> => {
  const supabase = createAnonClient();

  const { data, error } = await supabase
    .from("menu_items")
    .select("*, item_sizes(*), item_addon_groups(*, item_addon_options(*))")
    .eq("id", id)
    .order("sort_order", { referencedTable: "item_sizes" })
    .order("sort_order", { referencedTable: "item_addon_groups" })
    .order("sort_order", { referencedTable: "item_addon_groups.item_addon_options" })
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch item: ${error.message}`);
  }

  return data as unknown as MenuItemRow | null;
});
