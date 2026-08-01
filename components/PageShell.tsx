"use client";

import { useState, type ReactNode } from "react";
import type { Menu } from "@/lib/menu/types";
import { useCartContext } from "@/lib/cart/cart-context";
import { Header } from "@/components/menu/Header";
import { Hero } from "@/components/Hero";
import { MenuSection } from "@/components/menu/MenuSection";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { BottomBar } from "@/components/BottomBar";

/**
 * Cart now lives in a context provided at the root layout (see
 * lib/cart/cart-context.tsx), not local state here, because item detail
 * became a real route (app/item/[id]) that shares no client ancestor
 * with this tree when it's reached directly or refreshed. PageShell
 * still owns cart-drawer open/closed and the search-input ref the bottom
 * bar's "search" tab focuses, since those are purely this page's UI
 * state, not shared across routes.
 */
export function PageShell({ menu, children }: { menu: Menu; children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useCartContext();

  function focusSearch() {
    const el = document.getElementById("menu-search-input") as HTMLInputElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
  }

  function scrollToMenu() {
    const el = document.getElementById("menu");
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <div>
      <Header itemCount={cart.itemCount} onOpenCart={() => setCartOpen(true)} />
      <Hero />
      <MenuSection menu={menu} />
      {children}

      <BottomBar
        itemCount={cart.itemCount}
        onMenu={scrollToMenu}
        onSearch={focusSearch}
        onCart={() => setCartOpen(true)}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={cart.lines}
        removedNotices={cart.removedNotices}
        onDismissNotices={cart.dismissRemovedNotices}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeItem}
        onOrderComplete={cart.clearCart}
        grandTotal={cart.grandTotal}
      />
    </div>
  );
}
