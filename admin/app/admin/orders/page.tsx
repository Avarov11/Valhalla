export const dynamic = "force-dynamic";

/**
 * No orders table exists (see CLAUDE.md, Admin dashboard). The public
 * checkout flow builds a cart client-side and opens a wa.me link with
 * the order pre-filled as text, nothing is ever written to Supabase.
 * This page says that plainly rather than shipping a list that's
 * either empty forever or, worse, invites someone to wire it up to
 * fake data later. Building this for real needs a real decision: a new
 * table, what gets persisted and when, and critically how an anonymous
 * customer's browser is allowed to write to it, since right now every
 * anonymous insert/update/delete is denied everywhere in this project,
 * on purpose. That's a schema and security conversation, not a UI one.
 */
export default function AdminOrdersPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-(family-name:--font-display) text-(length:--text-2xl) text-(--text-primary)">Orders</h1>
        <p className="mt-1 text-(length:--text-sm) text-(--text-secondary)">
          Nothing to show yet, and that&rsquo;s accurate, not a bug.
        </p>
      </div>

      <div className="rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) p-6">
        <p className="text-(length:--text-sm) font-medium text-(--text-primary)">No orders are ever saved.</p>
        <p className="mt-2 max-w-2xl text-(length:--text-sm) text-(--text-secondary)">
          Checkout on the live site builds a cart in the browser, then opens WhatsApp with the order written out
          as a pre-filled message. That message is sent directly, it never touches this database. There is
          nothing this page could list without inventing it.
        </p>
        <p className="mt-3 max-w-2xl text-(length:--text-sm) text-(--text-secondary)">
          Turning this into a real list needs an <code>orders</code> table and a decision about how an order gets
          saved (probably: writing one at the moment &ldquo;Order on WhatsApp&rdquo; is clicked), including how an anonymous
          customer&rsquo;s browser is allowed to write to it, since every anonymous write is denied everywhere
          in this project right now, on purpose. That&rsquo;s a schema and RLS decision, not something to bolt
          onto this page.
        </p>
      </div>
    </div>
  );
}
