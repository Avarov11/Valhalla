import { getAdminMenu } from "@/lib/admin/get-admin-menu";
import { ProductsClient } from "./ProductsClient";

// Was force-dynamic (a live Supabase query on every navigation, no
// caching at all); switched to a short ISR window after a real report
// that switching tabs felt slow, see get-admin-menu.ts's own comment
// for the full reasoning. Every mutation already calls revalidatePath
// on both this route and /admin/stats, so a save/toggle/delete is
// reflected immediately regardless of this window; 30s only bounds
// staleness for page loads with no write in between.
export const revalidate = 30;

export default async function AdminProductsPage() {
  const menu = await getAdminMenu();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-(family-name:--font-display) text-(length:--text-2xl) text-(--text-primary)">
          Products
        </h1>
        <p className="mt-1 text-(length:--text-sm) text-(--text-secondary)">
          {menu.reduce((sum, c) => sum + c.menu_items.length, 0)} items across {menu.length} categories.
        </p>
      </div>
      <ProductsClient menu={menu} />
    </div>
  );
}
