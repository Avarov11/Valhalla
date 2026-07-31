"use client";

import { m } from "motion/react";
import type { Category } from "@/lib/menu/types";

type CategoryRailProps = {
  categories: Category[];
  activeId: string | null;
};

function scrollToCategory(slug: string) {
  const el = document.getElementById(slug);
  if (!el) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

export function CategoryRail({ categories, activeId }: CategoryRailProps) {
  return (
    <nav
      aria-label="Menu categories"
      className="h-(--rail-height) border-b border-(--border-default) bg-(--bg-page)"
    >
      <div className="flex h-full items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
        {categories.map((category) => {
          const isActive = category.slug === activeId;
          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => scrollToCategory(category.slug)}
              aria-current={isActive ? "true" : undefined}
              className="relative flex min-h-11 shrink-0 flex-col items-center justify-center rounded-(--radius-pill) border border-transparent px-3 py-1.5 leading-(--leading-tight) transition duration-(--duration-fast) active:scale-95"
            >
              {isActive ? (
                // Shared layoutId: when activeId moves to a different pill,
                // Motion animates this pill's own position/size delta rather
                // than cross-fading two separately-colored pills, so the
                // highlight visibly slides between categories.
                <m.span
                  layoutId="rail-active-indicator"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-(--radius-pill) border border-(--accent-solid) bg-(--accent-subtle-bg)"
                />
              ) : null}
              <span
                className={`relative z-10 text-(length:--text-sm) font-medium ${isActive ? "text-(--accent-text)" : "text-(--text-secondary)"}`}
              >
                {category.name_en}
              </span>
              <span
                className={`relative z-10 font-(family-name:--font-arabic) text-(length:--text-xs) ${isActive ? "text-(--accent-text)" : "text-(--text-muted)"}`}
              >
                {category.name_ar}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
