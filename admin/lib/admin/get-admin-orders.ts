import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

export type OrderStatus = "new" | "confirmed" | "completed" | "cancelled";

export type OrderItem = {
  item_id: string;
  name: string;
  size_label: string | null;
  addons: { name: string; price_delta: number }[];
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type Order = {
  id: string;
  created_at: string;
  status: OrderStatus;
  items: OrderItem[];
  total_price: number;
  whatsapp_message: string;
  customer_name: string | null;
  customer_phone: string | null;
};

/**
 * Same service_role client and cache() wrap as get-admin-menu.ts, same
 * reasoning: bypasses RLS (orders has zero anon policies at all, see
 * the migration's own comment), shared between the Orders list and the
 * Stats page's revenue card so both read the same live data.
 */
export const getAdminOrders = cache(async (): Promise<Order[]> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  return data as unknown as Order[];
});
