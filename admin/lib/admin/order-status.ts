/**
 * Types and constants only, zero imports, deliberately separate from
 * get-admin-orders.ts. OrderCard.tsx ("use client") needs the status
 * labels/colors/types, but get-admin-orders.ts also exports
 * getAdminOrders(), which imports the service-role Supabase client
 * (lib/supabase/admin.ts). A client component importing anything from
 * that file, even just a type or a const, pulls the whole module graph
 * into the client bundle along with it: caught this exact way, the
 * orders route's First Load JS jumped from ~2kB to ~65kB the moment
 * OrderCard.tsx imported STATUS_COLOR/STATUS_LABELS from
 * get-admin-orders.ts instead of from here. Anything a client
 * component needs lives in this file; anything that touches Supabase
 * stays in get-admin-orders.ts, which imports these types back from
 * here, not the other way around.
 */

export type OrderStatus = "new" | "confirmed" | "completed" | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = ["new", "confirmed", "completed", "cancelled"];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

/**
 * One color per status, fixed order, shared by every place a status
 * gets a color: OrderCard.tsx's dot and the Stats page's donut/legend.
 * Same entity, same color everywhere, never reassigned per-view (see
 * CLAUDE.md's dataviz-informed rules). completed uses the reserved
 * status-good green, not a categorical slot, since it's the one
 * genuinely positive terminal state; cancelled uses a plain neutral
 * (not a text token) since this is a decorative fill, not text.
 */
export const STATUS_COLOR: Record<OrderStatus, string> = {
  new: "var(--admin-stat-blue)",
  confirmed: "var(--admin-stat-orange)",
  completed: "var(--admin-status-good)",
  cancelled: "var(--border-strong)",
};

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
