"use client";

import type { Menu } from "@/lib/menu/types";
import { ProductRow } from "./ProductRow";
import { NewItemForm } from "./NewItemForm";

export function ProductsClient({ menu }: { menu: Menu }) {
  return (
    <div className="flex flex-col gap-8">
      {menu.map((category) => (
        <section key={category.id}>
          <div className="mb-2 flex items-baseline gap-2">
            <h2 className="text-(length:--text-lg) font-semibold text-(--text-primary)">{category.name_en}</h2>
            <span className="text-(length:--text-xs) text-(--text-muted)">
              {category.menu_items.length} item{category.menu_items.length === 1 ? "" : "s"}
              {category.is_active ? "" : " · inactive category"}
            </span>
          </div>

          <div className="rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) px-3">
            {category.menu_items.length === 0 ? (
              <p className="py-3 text-(length:--text-sm) text-(--text-muted)">No items yet.</p>
            ) : (
              category.menu_items.map((item) => <ProductRow key={item.id} item={item} />)
            )}
          </div>

          <NewItemForm categoryId={category.id} />
        </section>
      ))}
    </div>
  );
}
