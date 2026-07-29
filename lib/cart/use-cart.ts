"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Menu } from "@/lib/menu/types";
import type { CartLine, RemovedNotice } from "@/lib/cart/types";
import { readCartLines, writeCartLines } from "@/lib/cart/storage";
import { resolveCartLines } from "@/lib/cart/resolve";
import { buildWhatsAppOrder } from "@/lib/cart/whatsapp";

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
        (line) => !removed.some((r) => r.itemId === line.itemId && r.sizeLabel === line.sizeLabel),
      ),
    );
    // Only react to what actually got removed, not every line change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removed, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeCartLines(lines);
  }, [lines, hydrated]);

  const addItem = useCallback((itemId: string, sizeLabel: string | null, quantity: number) => {
    setLines((current) => {
      const existingIndex = current.findIndex((l) => l.itemId === itemId && l.sizeLabel === sizeLabel);
      if (existingIndex === -1) {
        return [...current, { itemId, sizeLabel, quantity }];
      }
      const next = [...current];
      next[existingIndex] = {
        ...next[existingIndex],
        quantity: next[existingIndex].quantity + quantity,
      };
      return next;
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, sizeLabel: string | null, quantity: number) => {
    setLines((current) => {
      if (quantity <= 0) {
        return current.filter((l) => !(l.itemId === itemId && l.sizeLabel === sizeLabel));
      }
      return current.map((l) =>
        l.itemId === itemId && l.sizeLabel === sizeLabel ? { ...l, quantity } : l,
      );
    });
  }, []);

  const removeItem = useCallback((itemId: string, sizeLabel: string | null) => {
    setLines((current) => current.filter((l) => !(l.itemId === itemId && l.sizeLabel === sizeLabel)));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);
  const dismissRemovedNotices = useCallback(() => setRemovedNotices([]), []);

  const grandTotal = useMemo(() => resolved.reduce((sum, line) => sum + line.lineTotal, 0), [resolved]);
  const itemCount = useMemo(() => resolved.reduce((sum, line) => sum + line.quantity, 0), [resolved]);
  const whatsapp = useMemo(() => buildWhatsAppOrder(resolved), [resolved]);

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
    whatsappUrl: whatsapp.url,
    whatsappMessage: whatsapp.message,
    whatsappTruncated: whatsapp.truncated,
  };
}
