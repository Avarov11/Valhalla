"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Menu, MenuItemRow } from "@/lib/menu/types";

type MenuContextValue = {
  getItemById: (id: string) => MenuItemRow | undefined;
};

const MenuContext = createContext<MenuContextValue | null>(null);

/**
 * The full menu (every item's name, price, description, image, sizes,
 * addons) is already fetched once at the root layout for CartProvider
 * and serialized down to the client either way. This just exposes a
 * by-id lookup over that same already-loaded data, so a component
 * reached by tapping a card that's already rendered from this exact
 * menu (the @modal interception, see ItemModal.tsx) can render
 * immediately from memory instead of re-fetching from Supabase. Only
 * covers the "reached from within the loaded app" case: a genuinely
 * fresh request (a direct link, a refresh) still goes through
 * app/item/[id]/page.tsx's own server fetch, unaffected by this.
 */
export function MenuProvider({ menu, children }: { menu: Menu; children: ReactNode }) {
  const value = useMemo<MenuContextValue>(() => {
    const byId = new Map<string, MenuItemRow>();
    for (const category of menu) {
      for (const item of category.menu_items) {
        byId.set(item.id, item);
      }
    }
    return { getItemById: (id) => byId.get(id) };
  }, [menu]);

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenuContext(): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error("useMenuContext must be used within a MenuProvider");
  }
  return ctx;
}
