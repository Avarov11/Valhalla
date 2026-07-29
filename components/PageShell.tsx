"use client";

import { useState, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import type { Menu } from "@/lib/menu/types";
import { useCart } from "@/lib/cart/use-cart";
import { Header } from "@/components/menu/Header";
import { Hero } from "@/components/Hero";
import { MenuSection } from "@/components/menu/MenuSection";
import { CartDrawer } from "@/components/cart/CartDrawer";

/**
 * Owns the cart (shared between the header's badge, the menu grid's add
 * buttons, and the cart drawer) and the header, which sits above the
 * hero too, not just the menu, so it's the one persistent element across
 * the whole page. `children` (the footer) is passed in from the server
 * component page so it stays server-rendered rather than getting pulled
 * into this client boundary just because it renders after this tree.
 *
 * `MotionConfig reducedMotion="user"` is the one place `prefers-reduced-motion`
 * is handled for every motion component in the tree. Branching each
 * component's own `initial`/`animate` props on a manually-read
 * `useReducedMotion()` value causes a hydration mismatch: the server has
 * no `window` to read the media query from, so it renders one shape,
 * and if the client's first render reads a different value before
 * hydration completes, React sees mismatched markup. MotionConfig
 * doesn't change what gets rendered, it changes how Motion executes the
 * animation, so there's nothing for server and client to disagree on.
 */
export function PageShell({ menu, children }: { menu: Menu; children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useCart(menu);

  return (
    <MotionConfig reducedMotion="user">
      <div>
        <Header itemCount={cart.itemCount} onOpenCart={() => setCartOpen(true)} />
        <Hero menu={menu} />
        <MenuSection menu={menu} onAdd={cart.addItem} />
        {children}

        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          lines={cart.lines}
          removedNotices={cart.removedNotices}
          onDismissNotices={cart.dismissRemovedNotices}
          onUpdateQuantity={cart.updateQuantity}
          onRemove={cart.removeItem}
          grandTotal={cart.grandTotal}
          whatsappUrl={cart.whatsappUrl}
          whatsappTruncated={cart.whatsappTruncated}
        />
      </div>
    </MotionConfig>
  );
}
