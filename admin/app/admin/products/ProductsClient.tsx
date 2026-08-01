"use client";

import type { Menu } from "@/lib/menu/types";
import { ProductCard } from "./ProductCard";
import { NewItemForm } from "./NewItemForm";

export function ProductsClient({ menu }: { menu: Menu }) {
  return (
    <div className="flex flex-col gap-8">
      {menu.map((category) => (
        <section key={category.id}>
          <div className="mb-3 flex items-baseline gap-2">
            <h2 className="text-(length:--text-lg) font-semibold text-(--text-primary)">{category.name_en}</h2>
            <span className="text-(length:--text-xs) text-(--text-muted)">
              {category.menu_items.length} item{category.menu_items.length === 1 ? "" : "s"}
              {category.is_active ? "" : " · inactive category"}
            </span>
          </div>

          {category.menu_items.length === 0 ? (
            <p className="rounded-(--radius-md) border border-dashed border-(--border-strong) py-6 text-center text-(length:--text-sm) text-(--text-muted)">
              No items yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {category.menu_items.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          )}

          <NewItemForm categoryId={category.id} />
        </section>
      ))}
    </div>
  );
}
