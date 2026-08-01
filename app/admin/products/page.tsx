import { getAdminMenu } from "@/lib/admin/get-admin-menu";
import { ProductsClient } from "./ProductsClient";

export const dynamic = "force-dynamic";

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
