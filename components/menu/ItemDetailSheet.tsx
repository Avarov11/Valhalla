"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, X } from "@phosphor-icons/react";
import type { MenuItemRow } from "@/lib/menu/types";
import { formatPrice } from "@/lib/menu/format";

type ItemDetailSheetProps = {
  item: MenuItemRow | null;
  onClose: () => void;
  onAdd: (itemId: string, sizeLabel: string | null, quantity: number) => void;
};

/**
 * Tap a card, see the full picture, the full description, pick a size if
 * there is one, pick a quantity, then add. Bottom sheet rather than the
 * cart drawer's side panel, so the two overlays read as distinct kinds of
 * thing (browsing one item vs reviewing the whole order) even though they
 * share the same open/close/backdrop mechanics.
 *
 * `displayedItem` keeps rendering the last real item while the sheet
 * animates closed (`item` itself goes null immediately on close), so the
 * exit transition has content to animate instead of popping to empty.
 */
export function ItemDetailSheet({ item, onClose, onAdd }: ItemDetailSheetProps) {
  const [displayedItem, setDisplayedItem] = useState<MenuItemRow | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!item) return;
    setDisplayedItem(item);
    setSelectedSize(item.item_sizes.length > 0 ? item.item_sizes[0].label : null);
    setQuantity(1);
  }, [item]);

  useEffect(() => {
    if (!item) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [item, onClose]);

  const open = item !== null;
  const hasSizes = (displayedItem?.item_sizes.length ?? 0) > 0;
  const unitPrice = displayedItem
    ? hasSizes
      ? (displayedItem.item_sizes.find((s) => s.label === selectedSize)?.price ??
        displayedItem.item_sizes[0].price)
      : (displayedItem.price ?? 0)
    : 0;
  const isAvailable = displayedItem?.is_available ?? false;

  return (
    <AnimatePresence>
      {open && displayedItem ? (
        <>
          <motion.div
            key="detail-overlay"
            className="fixed inset-0 z-(--z-modal) bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            key="detail-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={displayedItem.name_en}
            className="fixed inset-x-0 bottom-0 z-(--z-modal) flex max-h-[88dvh] flex-col overflow-hidden rounded-t-(--radius-lg) bg-(--bg-page) shadow-(--shadow-lg) sm:inset-x-auto sm:left-1/2 sm:bottom-auto sm:top-1/2 sm:max-h-[85dvh] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-(--radius-lg)"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-(--radius-pill) bg-(--border-strong) sm:hidden" />

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-(--radius-pill) bg-(--bg-page)/80 text-(--text-secondary) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover) active:scale-90"
            >
              <X size={18} />
            </button>

            <div className="overflow-y-auto">
              <div className="relative aspect-[4/3] w-full bg-(--bg-unavailable)">
                {displayedItem.image_url ? (
                  <Image
                    src={displayedItem.image_url}
                    alt={displayedItem.name_en}
                    fill
                    sizes="(max-width: 640px) 100vw, 28rem"
                    className="object-cover"
                  />
                ) : null}
                {!isAvailable ? (
                  <span className="absolute left-3 top-3 rounded-(--radius-pill) border border-(--border-strong) bg-(--bg-surface) px-2 py-0.5 text-(length:--text-xs) font-medium text-(--text-secondary)">
                    Sold out
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-4 p-5">
                <div>
                  <h2 className="font-(family-name:--font-display) text-(length:--text-xl) text-(--text-primary)">
                    {displayedItem.name_en}
                  </h2>
                  {displayedItem.description ? (
                    <p className="mt-1 text-(length:--text-sm) text-(--text-secondary)">
                      {displayedItem.description}
                    </p>
                  ) : null}
                </div>

                {hasSizes ? (
                  <div
                    className="flex flex-wrap gap-2"
                    role="radiogroup"
                    aria-label={`Size for ${displayedItem.name_en}`}
                  >
                    {displayedItem.item_sizes.map((size) => {
                      const selected = size.label === selectedSize;
                      return (
                        <button
                          key={size.label}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={!isAvailable}
                          aria-disabled={!isAvailable}
                          onClick={() => setSelectedSize(size.label)}
                          className={`flex min-h-11 items-center rounded-(--radius-pill) border px-3 py-1.5 text-(length:--text-sm) font-medium transition duration-(--duration-fast) active:scale-95 disabled:cursor-not-allowed ${
                            selected
                              ? "border-(--accent-solid) bg-(--accent-subtle-bg) text-(--accent-text)"
                              : "border-(--border-default) text-(--text-secondary)"
                          }`}
                        >
                          {size.label} · {formatPrice(size.price)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-(length:--text-lg) font-semibold text-(--text-primary)">
                    {formatPrice(unitPrice)}
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-(length:--text-sm) text-(--text-secondary)">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="flex h-11 w-11 items-center justify-center rounded-(--radius-pill) border border-(--border-default) text-(--text-secondary) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover) active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Minus size={14} />
                    </button>
                    <motion.span
                      key={quantity}
                      initial={{ scale: 1.25 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="w-6 text-center text-(length:--text-md) text-(--text-primary)"
                    >
                      {quantity}
                    </motion.span>
                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label="Increase quantity"
                      className="flex h-11 w-11 items-center justify-center rounded-(--radius-pill) border border-(--border-default) text-(--text-secondary) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover) active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => {
                    onAdd(displayedItem.id, selectedSize, quantity);
                    onClose();
                  }}
                  className="flex w-full items-center justify-center rounded-(--radius-pill) bg-(--accent-solid) px-4 py-3 text-(length:--text-sm) font-medium text-(--text-on-accent) transition duration-(--duration-fast) hover:bg-(--accent-solid-hover) active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-(--bg-unavailable) disabled:text-(--text-muted)"
                >
                  {isAvailable ? `Add · ${formatPrice(unitPrice * quantity)}` : "Sold out"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
