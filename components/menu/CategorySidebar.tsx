"use client";

import { m } from "motion/react";
import type { Category } from "@/lib/menu/types";

type CategorySidebarProps = {
  categories: Category[];
  activeId: string | null;
};

function scrollToCategory(slug: string) {
  const el = document.getElementById(slug);
  if (!el) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

/**
 * "Tablet is not a big phone": at 1024 landscape and up this replaces the
 * horizontal scrolling CategoryRail with a persistent vertical list beside
 * the grid, per REDESIGN.md. Same scroll-spy mechanic and jump targets as
 * the rail (useScrollSpy, #<slug> anchors), just a different shape, so it
 * shares real infrastructure rather than being a parallel system.
 */
export function CategorySidebar({ categories, activeId }: CategorySidebarProps) {
  return (
    <nav aria-label="Menu categories" className="flex flex-col gap-1">
      {categories.map((category) => {
        const isActive = category.slug === activeId;
        return (
          <button
            key={category.slug}
            type="button"
            onClick={() => scrollToCategory(category.slug)}
            aria-current={isActive ? "true" : undefined}
            className="relative flex min-h-11 items-center rounded-(--radius-md) px-3 py-2 text-left transition duration-(--duration-fast)"
          >
            {isActive ? (
              <m.span
                layoutId="sidebar-active-indicator"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-(--radius-md) border border-(--accent-solid) bg-(--accent-subtle-bg)"
              />
            ) : null}
            <span className="relative z-10 flex flex-col">
              <span
                className={`text-(length:--text-sm) font-medium ${isActive ? "text-(--accent-text)" : "text-(--text-secondary)"}`}
              >
                {category.name_en}
              </span>
              <span
                className={`font-(family-name:--font-arabic) text-(length:--text-xs) ${isActive ? "text-(--accent-text)" : "text-(--text-muted)"}`}
              >
                {category.name_ar}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
