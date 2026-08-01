"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Menu } from "@/lib/menu/types";
import type { CartLine, RemovedNotice } from "@/lib/cart/types";
import { readCartLines, writeCartLines } from "@/lib/cart/storage";
import { resolveCartLines } from "@/lib/cart/resolve";

/**
 * A cart line's real identity is item + size + addon selection, not
 * just item + size: the same drink with different extras is a
 * different order, not a quantity bump on the same one. addItem always
 * sorts incoming ids before this runs (single place responsible for
 * it, not every call site), so this is a plain positional compare, not
 * a set comparison.
 */
function sameAddons(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

export function useCart(menu: Menu) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [removedNotices, setRemovedNotices] = useState<RemovedNotice[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(readCartLines());
    setHydrated(true);
  }, []);

  const { resolved, removed } = useMemo(() => resolveCartLines(lines, menu), [lines, menu]);

  useEffect(() => {
    if (!hydrated || removed.length === 0) return;

    setRemovedNotices(removed);
    setLines((current) =>
      current.filter(
        (line) =>
          !removed.some(
            (r) =>
              r.itemId === line.itemId &&
              r.sizeLabel === line.sizeLabel &&
              sameAddons(r.addonOptionIds, line.addonOptionIds),
          ),
      ),
    );
  }, [removed, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeCartLines(lines);
  }, [lines, hydrated]);

  const addItem = useCallback(
    (itemId: string, sizeLabel: string | null, addonOptionIds: string[], quantity: number) => {
      const sortedAddons = [...addonOptionIds].sort();
      setLines((current) => {
        const existingIndex = current.findIndex(
          (l) => l.itemId === itemId && l.sizeLabel === sizeLabel && sameAddons(l.addonOptionIds, sortedAddons),
        );
        if (existingIndex === -1) {
          return [...current, { itemId, sizeLabel, addonOptionIds: sortedAddons, quantity }];
        }
        const next = [...current];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      });
    },
    [],
  );

  const updateQuantity = useCallback(
    (itemId: string, sizeLabel: string | null, addonOptionIds: string[], quantity: number) => {
      setLines((current) => {
        if (quantity <= 0) {
          return current.filter(
            (l) => !(l.itemId === itemId && l.sizeLabel === sizeLabel && sameAddons(l.addonOptionIds, addonOptionIds)),
          );
        }
        return current.map((l) =>
          l.itemId === itemId && l.sizeLabel === sizeLabel && sameAddons(l.addonOptionIds, addonOptionIds)
            ? { ...l, quantity }
            : l,
        );
      });
    },
    [],
  );

  const removeItem = useCallback((itemId: string, sizeLabel: string | null, addonOptionIds: string[]) => {
    setLines((current) =>
      current.filter(
        (l) => !(l.itemId === itemId && l.sizeLabel === sizeLabel && sameAddons(l.addonOptionIds, addonOptionIds)),
      ),
    );
  }, []);

  const clearCart = useCallback(() => setLines([]), []);
  const dismissRemovedNotices = useCallback(() => setRemovedNotices([]), []);

  const grandTotal = useMemo(() => resolved.reduce((sum, line) => sum + line.lineTotal, 0), [resolved]);
  const itemCount = useMemo(() => resolved.reduce((sum, line) => sum + line.quantity, 0), [resolved]);

  return {
    hydrated,
    lines: resolved,
    removedNotices,
    dismissRemovedNotices,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    grandTotal,
    itemCount,
  };
}
