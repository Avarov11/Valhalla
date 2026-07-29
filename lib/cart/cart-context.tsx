"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Menu } from "@/lib/menu/types";
import { useCart } from "@/lib/cart/use-cart";

type CartContextValue = ReturnType<typeof useCart>;

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Cart state used to live only inside PageShell's local state. Once item
 * detail became a real route (app/item/[id], intercepted as a modal from
 * within the app, see app/@modal), "add to cart" needed to work from a
 * completely different route subtree that doesn't share a common client
 * ancestor with PageShell. Lifting useCart's instance up into a context
 * provided once at the root layout, above both `children` and `@modal`,
 * is what lets both trees mutate and read the exact same cart.
 */
export function CartProvider({ menu, children }: { menu: Menu; children: ReactNode }) {
  const cart = useCart(menu);
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return ctx;
}
