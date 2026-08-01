import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/lib/admin/order-status";

export type { Order } from "@/lib/admin/order-status";

/**
 * Same service_role client and cache() wrap as get-admin-menu.ts, same
 * reasoning: bypasses RLS (orders has zero anon policies at all, see
 * the migration's own comment), shared between the Orders list and the
 * Stats page's revenue/status charts so both read the same live data.
 *
 * Server-only file, imports the service-role client: never import this
 * specific export from a "use client" file, see order-status.ts's own
 * comment for what happened the one time that got mixed up.
 */
export const getAdminOrders = cache(async (): Promise<Order[]> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  return data as unknown as Order[];
});
