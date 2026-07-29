"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Menu } from "@/lib/menu/types";
import { filterMenu } from "@/lib/menu/search";
import { useScrollSpy } from "@/lib/menu/use-scroll-spy";
import { SearchBar } from "@/components/menu/SearchBar";
import { CategoryRail } from "@/components/menu/CategoryRail";
import { CategorySidebar } from "@/components/menu/CategorySidebar";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { EmptySearchState } from "@/components/menu/EmptySearchState";

type MenuSectionProps = {
  menu: Menu;
};

/**
 * The menu browsing surface. Two layouts share the same section markup
 * and the same scroll-spy/jump-anchor machinery, switched with responsive
 * classes rather than a JS breakpoint branch, per REDESIGN.md's split:
 *
 * Below lg (phone AND tablet portrait, 768 included): the sticky
 * search+rail block on top, categories stacked full width underneath.
 * "768 portrait is its own case" gets its own grid-column count (md:),
 * not just the phone's 2 columns stretched.
 *
 * lg and up (tablet landscape, 1024, and desktop): a persistent left
 * sidebar replaces the horizontal rail, "a stretched phone column is
 * not" a real tablet layout. Search stays sticky at the top of the
 * (now narrower) content column.
 */
export function MenuSection({ menu }: MenuSectionProps) {
  const [query, setQuery] = useState("");
  const railBlockRef = useRef<HTMLDivElement>(null);

  const filteredMenu = useMemo(() => filterMenu(menu, query), [menu, query]);
  const categoryIds = useMemo(() => filteredMenu.map((c) => c.slug), [filteredMenu]);
  const activeId = useScrollSpy(categoryIds, railBlockRef);

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

  const sections =
    filteredMenu.length === 0 ? (
      <EmptySearchState query={query} />
    ) : (
      filteredMenu.map((category) => (
        <section
          key={category.slug}
          id={category.slug}
          aria-labelledby={`${category.slug}-heading`}
          className="category-section py-6 first:pt-2 lg:py-8"
        >
          <div className="mb-4">
            <h2
              id={`${category.slug}-heading`}
              className="font-(family-name:--font-display) text-(length:--text-2xl) tracking-(--tracking-tight) text-(--text-primary)"
            >
              {category.name_en}{" "}
              <span className="font-(family-name:--font-arabic) text-(length:--text-lg) font-normal text-(--text-secondary)">
                {category.name_ar}
              </span>{" "}
              <span className="text-(length:--text-sm) font-normal text-(--text-muted)">
                ({category.menu_items.length})
              </span>
            </h2>
            {category.blurb ? (
              <p className="mt-1 text-(length:--text-sm) text-(--text-secondary)">{category.blurb}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {category.menu_items.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))
    );

  return (
    <div id="menu" className="mx-auto max-w-(--page-max-width) lg:grid lg:grid-cols-[15rem_1fr] lg:gap-8 lg:px-6 lg:py-8">
      <aside className="hidden lg:block">
        <div className="sticky top-[calc(var(--header-height)+2rem)]">
          <CategorySidebar categories={filteredMenu} activeId={activeId} />
        </div>
      </aside>

      <div>
        <div ref={railBlockRef} className="sticky top-(--header-height) z-(--z-rail) bg-(--bg-page) lg:pb-4">
          <div className="border-b border-(--border-default) px-4 py-2 lg:border-none lg:px-0 lg:py-0">
            <SearchBar value={query} onChange={setQuery} />
          </div>
          <div className="lg:hidden">
            <CategoryRail categories={filteredMenu} activeId={activeId} />
          </div>
        </div>

        <main className="px-4 py-6 lg:px-0 lg:py-0">{sections}</main>
      </div>
    </div>
  );
}
