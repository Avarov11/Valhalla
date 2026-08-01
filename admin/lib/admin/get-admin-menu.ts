import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Menu } from "@/lib/menu/types";

/**
 * Deliberately its own fetch, not lib/menu/get-menu.ts's getMenu(): the
 * service_role client bypasses RLS entirely, categories.is_active and
 * menu_items.is_available included, admin needs to see everything, not
 * just what a customer would. Shared across every admin page that needs
 * the full catalog (products, stats). Wrapped in React's cache() same
 * as the customer site's own getMenu(), for request-scoped dedup if a
 * future page ever calls it more than once per render.
 *
 * Was deliberately NOT time-cached at all (2026-08-01), reasoning: "admin
 * data should always be current." Revisited the same day after a real
 * report that switching tabs felt slow: every single navigation between
 * Products and Stats was re-running this full nested query live, with
 * no caching whatsoever, on a route additionally marked force-dynamic.
 * That reasoning missed that freshness-after-a-write was already solved
 * a different way: every product mutation calls revalidatePath
 * ("/admin/products") already (see actions.ts), which invalidates
 * Next's cache immediately regardless of any revalidate window. A short
 * ISR window on top of that (see products/page.tsx, stats/page.tsx)
 * only affects staleness in the gap between page loads with NO write in
 * between, which 30 seconds of staleness is a fine trade for not
 * re-querying Supabase on every tab click.
 */
export const getAdminMenu = cache(async (): Promise<Menu> => {
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
});
