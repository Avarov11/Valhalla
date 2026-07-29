"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Minus, Plus } from "@phosphor-icons/react";
import type { MenuItemRow } from "@/lib/menu/types";
import { formatPrice } from "@/lib/menu/format";
import { useCartContext } from "@/lib/cart/cart-context";

/**
 * The actual detail UI, shared between the two routes that show it: the
 * real standalone page at /item/[id] (deep-linkable, so a single item can
 * be dropped into a WhatsApp conversation) and the intercepted modal
 * version rendered over the grid when navigated to from within the app
 * (app/@modal/(.)item/[id]). Both wrap this in their own chrome, this
 * component only owns image, name, description, size selection, quantity
 * and the add-to-cart action.
 */
export function ItemDetailContent({
  item,
  topRightSlot,
  onAdded,
}: {
  item: MenuItemRow;
  topRightSlot?: ReactNode;
  onAdded?: () => void;
}) {
  const cart = useCartContext();
  const hasSizes = item.item_sizes.length > 0;
  const [selectedSize, setSelectedSize] = useState<string | null>(
    hasSizes ? item.item_sizes[0].label : null,
  );
  const [quantity, setQuantity] = useState(1);

  const isAvailable = item.is_available;
  const unitPrice = hasSizes
    ? (item.item_sizes.find((s) => s.label === selectedSize)?.price ?? item.item_sizes[0].price)
    : (item.price ?? 0);

  function handleAdd() {
    cart.addItem(item.id, selectedSize, quantity);
    onAdded?.();
  }

  return (
    <div className="flex flex-col">
      <div className="relative aspect-[4/3] w-full shrink-0 bg-(--bg-unavailable)">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name_en}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 32rem"
            className={`object-cover ${isAvailable ? "" : "opacity-50"}`}
          />
        ) : null}
        {!isAvailable ? (
          <span className="absolute left-4 top-4 rounded-(--radius-pill) border border-(--border-strong) bg-(--bg-surface) px-3 py-1 text-(length:--text-xs) font-medium text-(--text-secondary)">
            Sold out
          </span>
        ) : null}
        {topRightSlot}
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div>
          <h1 className="font-(family-name:--font-display) text-(length:--text-2xl) tracking-(--tracking-tight) text-(--text-primary)">
            {item.name_en}
          </h1>
          {item.description ? (
            <p className="mt-2 text-(length:--text-sm) leading-(--leading-normal) text-(--text-secondary)">
              {item.description}
            </p>
          ) : null}
        </div>

        {hasSizes ? (
          <div role="radiogroup" aria-label={`Size for ${item.name_en}`} className="flex flex-wrap gap-2">
            {item.item_sizes.map((size) => {
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
                  className={`flex min-h-11 items-center rounded-(--radius-pill) border px-4 text-(length:--text-sm) font-medium transition duration-(--duration-fast) active:scale-95 disabled:cursor-not-allowed ${
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
          <p className="font-(family-name:--font-display) text-(length:--text-3xl) tracking-(--tracking-tight) text-(--accent-text)">
            {formatPrice(unitPrice)}
          </p>
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
          onClick={handleAdd}
          className="flex min-h-12 w-full items-center justify-center rounded-(--radius-pill) bg-(--accent-solid) px-4 text-(length:--text-sm) font-semibold text-(--text-on-accent) transition duration-(--duration-fast) hover:bg-(--accent-solid-hover) active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-(--bg-unavailable) disabled:text-(--text-muted)"
        >
          {isAvailable ? `Add · ${formatPrice(unitPrice * quantity)}` : "Sold out"}
        </button>
      </div>
    </div>
  );
}
