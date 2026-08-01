import { getAdminOrders } from "@/lib/admin/get-admin-orders";
import { OrderCard } from "./OrderCard";

// Same ISR window as products/stats, see those pages' own comments for
// the full reasoning. setOrderStatus already calls revalidatePath on
// this route, so a status change is reflected immediately regardless.
export const revalidate = 30;

/**
 * Real orders now (2026-08-01), built on direct request after being
 * deferred earlier the same day (see CLAUDE.md, Admin dashboard,
 * Orders). Each row here was written by lib/orders/create-order.ts on
 * the customer site, at the moment "Order on WhatsApp" was clicked,
 * re-resolved server-side against live menu data rather than trusted
 * from the browser. This page only reads and updates status, it never
 * writes a new order itself, that only ever happens from the customer
 * site's own checkout flow.
 */
export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-(family-name:--font-display) text-(length:--text-2xl) text-(--text-primary)">Orders</h1>
        <p className="mt-1 text-(length:--text-sm) text-(--text-secondary)">
          {orders.length} order{orders.length === 1 ? "" : "s"} recorded.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-(--radius-md) border border-dashed border-(--border-strong) p-6 text-center">
          <p className="text-(length:--text-sm) font-medium text-(--text-primary)">No orders yet.</p>
          <p className="mt-1 text-(length:--text-sm) text-(--text-secondary)">
            A row appears here the moment a customer taps &ldquo;Order on WhatsApp&rdquo; on the live site.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
