"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Menu } from "@/lib/menu/types";
import { filterMenu } from "@/lib/menu/search";
import { useScrollSpy } from "@/lib/menu/use-scroll-spy";
import { SearchBar } from "@/components/menu/SearchBar";
import { CategoryRail } from "@/components/menu/CategoryRail";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { EmptySearchState } from "@/components/menu/EmptySearchState";
import { ItemDetailSheet } from "@/components/menu/ItemDetailSheet";

type MenuSectionProps = {
  menu: Menu;
  onAdd: (itemId: string, sizeLabel: string | null, quantity: number) => void;
};

/**
 * The menu browsing surface: search, the sticky category rail, and the
 * item grid. Rendered below the hero. Its own search+rail block is
 * sticky at top: header-height, so it tucks in right under the
 * page-level header (which is also visible over the hero, see
 * PageShell) rather than owning the header itself.
 */
export function MenuSection({ menu, onAdd }: MenuSectionProps) {
  const [query, setQuery] = useState("");
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const railBlockRef = useRef<HTMLDivElement>(null);

  const filteredMenu = useMemo(() => filterMenu(menu, query), [menu, query]);
  const categoryIds = useMemo(() => filteredMenu.map((c) => c.slug), [filteredMenu]);
  const activeId = useScrollSpy(categoryIds, railBlockRef);

  // Looked up from the full menu, not filteredMenu, so the sheet still
  // has its item if the search query changes while it's open.
  const openItem = useMemo(() => {
    if (!openItemId) return null;
    for (const category of menu) {
      const found = category.menu_items.find((item) => item.id === openItemId);
      if (found) return found;
    }
    return null;
  }, [menu, openItemId]);

  // Category jump targets need scroll-margin-top equal to header height
  // plus this block's real height. Measuring it instead of hand-summing
  // tokens means adding or resizing a row here can't silently desync the
  // anchor offset again (see globals.css .category-section).
  useEffect(() => {
    const el = railBlockRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty("--rail-block-height", `${entry.contentRect.height}px`);
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div id="menu">
      <div ref={railBlockRef} className="sticky top-(--header-height) z-(--z-rail)">
        <div className="border-b border-(--border-default) bg-(--bg-page) px-4 py-2">
          <SearchBar value={query} onChange={setQuery} />
        </div>
        <CategoryRail categories={filteredMenu} activeId={activeId} />
      </div>

      <main className="mx-auto max-w-(--page-max-width) px-4 py-6">
        {filteredMenu.length === 0 ? (
          <EmptySearchState query={query} />
        ) : (
          filteredMenu.map((category) => (
            <section
              key={category.slug}
              id={category.slug}
              aria-labelledby={`${category.slug}-heading`}
              className="category-section py-6"
            >
              <div className="mb-4">
                <h2
                  id={`${category.slug}-heading`}
                  className="font-(family-name:--font-display) text-(length:--text-2xl) tracking-(--tracking-tight) text-(--text-primary)"
                >
                  {category.name_en}{" "}
                  <span className="font-(family-name:--font-arabic) text-(length:--text-lg) font-normal text-(--text-secondary)">
                    {category.name_ar}
                  </span>
                </h2>
                {category.blurb ? (
                  <p className="mt-1 text-(length:--text-sm) text-(--text-secondary)">{category.blurb}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {category.menu_items.map((item) => (
                  <MenuItemCard key={item.id} item={item} onOpen={setOpenItemId} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <ItemDetailSheet item={openItem} onClose={() => setOpenItemId(null)} onAdd={onAdd} />
    </div>
  );
}
