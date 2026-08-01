import { createAdminClient } from "@/lib/supabase/admin";
import type { Menu } from "@/lib/menu/types";

/**
 * Deliberately its own fetch, not lib/menu/get-menu.ts's getMenu(): that
 * one uses the anon client and React's cache() for the public grid,
 * this one uses the service_role client specifically so RLS is bypassed
 * entirely, categories.is_active and menu_items.is_available included,
 * admin needs to see everything, not just what a customer would. Shared
 * across every admin page that needs the full catalog (products, stats),
 * not cached the way getMenu() is: admin data should always be current,
 * not revalidate-window-stale.
 */
export async function getAdminMenu(): Promise<Menu> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*, menu_items(*, item_sizes(*), item_addon_groups(*, item_addon_options(*)))")
    .order("sort_order")
    .order("sort_order", { referencedTable: "menu_items" })
    .order("sort_order", { referencedTable: "menu_items.item_sizes" });

  if (error) {
    throw new Error(`Failed to fetch admin menu: ${error.message}`);
  }

  return data as unknown as Menu;
}
