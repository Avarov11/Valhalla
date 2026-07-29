"use client";

import { memo } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import type { MenuItemRow } from "@/lib/menu/types";
import { formatPrice } from "@/lib/menu/format";

type MenuItemCardProps = {
  item: MenuItemRow;
  onOpen: (itemId: string) => void;
};

/**
 * A preview, not a buy button: image, name, price. Tapping anywhere on
 * the card opens ItemDetailSheet, where the full description, size
 * picker, quantity, and the actual add-to-cart action live. Keeps the
 * grid scannable across 134 items instead of every card carrying a full
 * size-picker and add button.
 *
 * Handles is_available = false itself: dimmed, "Sold out" badge, no
 * second accent color for that state. The card stays tappable even when
 * sold out, so someone can still see what it is, the detail sheet is
 * what disables the actual add controls.
 *
 * `onOpen` takes the item id itself so the same stable callback (see
 * MenuSection's `setOpenItemId`, a bare useState setter, already stable)
 * passes unchanged to all ~134 cards, which combined with `memo` means a
 * cart update doesn't force every card to re-render.
 */
export const MenuItemCard = memo(function MenuItemCard({ item, onOpen }: MenuItemCardProps) {
  const hasSizes = item.item_sizes.length > 0;
  const displayPrice = hasSizes
    ? Math.min(...item.item_sizes.map((s) => s.price))
    : (item.price ?? 0);
  const isAvailable = item.is_available;

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(item.id)}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: isAvailable ? 1 : 0.6, y: 0 }}
      whileTap={{ scale: 0.97 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col overflow-hidden rounded-(--radius-lg) border border-(--border-default) bg-(--bg-surface) text-left transition-colors duration-(--duration-fast) hover:bg-(--bg-surface-hover)"
    >
      <div className="relative aspect-[4/3] w-full bg-(--bg-unavailable)">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name_en}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : null}

        {item.is_popular && isAvailable ? (
          <span className="absolute left-2 top-2 rounded-(--radius-pill) bg-(--accent-solid) px-2 py-0.5 text-(length:--text-xs) font-medium text-(--text-on-accent)">
            Popular
          </span>
        ) : null}

        {!isAvailable ? (
          <span className="absolute right-2 top-2 rounded-(--radius-pill) border border-(--border-strong) bg-(--bg-surface) px-2 py-0.5 text-(length:--text-xs) font-medium text-(--text-secondary)">
            Sold out
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1 p-3">
        <h3 className="font-(family-name:--font-display) text-(length:--text-md) leading-(--leading-snug) text-(--text-primary)">
          {item.name_en}
        </h3>
        <span className="text-(length:--text-sm) font-semibold text-(--text-primary)">
          {hasSizes ? `From ${formatPrice(displayPrice)}` : formatPrice(displayPrice)}
        </span>
      </div>
    </motion.button>
  );
});
