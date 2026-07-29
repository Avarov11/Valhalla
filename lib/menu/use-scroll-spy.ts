"use client";

import { useEffect, useState } from "react";

/**
 * Which category section is "current" while scrolling, for the rail's
 * highlight. IntersectionObserver only, no scroll listener. The root
 * margin is measured from the sticky header+rail wrapper's own height
 * (via stickyRef) so the active section lines up with what's actually
 * visible below the sticky bars, rather than a hardcoded pixel guess.
 */
export function useScrollSpy(
  sectionIds: string[],
  stickyRef: React.RefObject<HTMLElement | null>,
): string | null {
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null);

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const offset = stickyRef.current?.getBoundingClientRect().bottom ?? 0;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;

        const topMost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        setActiveId(topMost.target.id);
      },
      {
        rootMargin: `-${Math.max(0, Math.round(offset))}px 0px -60% 0px`,
        threshold: 0,
      },
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sectionIds, stickyRef]);

  return activeId;
}
