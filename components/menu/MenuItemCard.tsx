"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import type { MenuItemRow } from "@/lib/menu/types";
import { formatPrice } from "@/lib/menu/format";

type MenuItemCardProps = {
  item: MenuItemRow;
};

/**
 * The whole card is one link to /item/[id], where description, size
 * selection, quantity and the actual add-to-cart action live now (see
 * REDESIGN.md: "item detail does not exist yet, build it"). No separate
 * add control on the grid card, so there's nothing to nest, and no click
 * isolation to get wrong.
 *
 * The footer plate overlaps the image by a fixed amount (-mt-7) rather
 * than sitting flush below it. That overlap is the deliberate answer to
 * "what happens to the white wave at the bottom of the template photos":
 * every one of the 134 photos gets its bottom edge covered by the same
 * opaque plate, whether that photo has the pink-panel-and-wave template
 * or a completely different backdrop, so the crop reads as one designed
 * frame across the catalogue rather than 134 individual template edges.
 *
 * Price is the dominant line in the footer (display face, accent colour,
 * larger than the name), not small grey text next to a description, per
 * "price should be a typographic event."
 *
 * Card stays tappable when unavailable, so someone can still see what it
 * is; the actual disabled control is the add button on the detail page.
 *
 * Available cards get --shadow-card, a rose-tinted glow (rgba built from
 * the accent ramp, not the neutral shadow used everywhere else) instead
 * of a plain drop shadow, so the grid reads as warm and lit rather than
 * generic elevation. Unavailable cards keep the plain --shadow-md, so
 * the glow itself becomes a small signal of "in stock", not just
 * decoration sitting under every card regardless of state.
 */
export const MenuItemCard = memo(function MenuItemCard({ item }: MenuItemCardProps) {
  const hasSizes = item.item_sizes.length > 0;
  const displayPrice = hasSizes
    ? Math.min(...item.item_sizes.map((s) => s.price))
    : (item.price ?? 0);
  const isAvailable = item.is_available;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: isAvailable ? 1 : 0.65, y: 0 }}
      whileTap={{ scale: 0.97 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`overflow-hidden rounded-(--radius-lg) bg-(--bg-surface) ${isAvailable ? "shadow-(--shadow-card)" : "shadow-(--shadow-md)"}`}
    >
      <Link
        href={`/item/${item.id}`}
        aria-label={`View ${item.name_en}, ${hasSizes ? "from " : ""}${formatPrice(displayPrice)}${!isAvailable ? ", sold out" : ""}`}
        className="flex flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--accent-ring) focus-visible:outline-offset-[-2px]"
      >
        {/*
          One universal square for every card, not per-category: tried
          per-category shapes (landscape for the rolls, portrait for the
          drink jars) and it made cards different sizes across
          categories, which read as inconsistent rather than considered.
          Every source image in storage is pre-cropped to this same
          1200x1200 square already (see scripts/recrop-images.ts), using
          sharp's attention strategy (content-aware saliency detection,
          not a fixed anchor point), so plain object-cover here doesn't
          need a position override, the crop already happened at the
          source.
        */}
        <div className="relative aspect-square w-full bg-(--bg-unavailable)">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name_en}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover ${isAvailable ? "" : "opacity-60"}`}
            />
          ) : null}

          {item.is_popular && isAvailable ? (
            <span
              className="absolute left-0 top-3 bg-(--accent-solid) py-1 pl-3 pr-4 text-(length:--text-xs) font-semibold uppercase tracking-(--tracking-wide) text-(--text-on-accent)"
              style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 0% 100%)" }}
            >
              Popular
            </span>
          ) : null}

          {!isAvailable ? (
            <span className="absolute right-3 top-3 rounded-(--radius-pill) border border-(--border-strong) bg-(--bg-surface) px-2 py-0.5 text-(length:--text-xs) font-medium text-(--text-secondary)">
              Sold out
            </span>
          ) : null}
        </div>

        {/*
          Fixed light plate, not the theme-reactive --bg-surface: the
          template photos bake in a white wave at the bottom (see
          REDESIGN.md, "the ugliest part of the template... the part
          most worth taking control of"). Its height varies enough
          across the corpus that no fixed overlap depth covers it in
          every photo without also eating into the product itself
          (verified: -mt-16 still showed wave AND clipped the cup). A
          plate that always matches the wave's own white, in both app
          themes, reads as one continuous surface instead of a seam,
          which a theme-reactive dark-mode plate cannot do against a
          photo pixel that never gets dark. Name and price are fixed
          dark-on-light here for the same reason: this plate does not
          participate in the page's light/dark toggle.
        */}
        <div className="relative z-10 -mt-7 flex flex-col gap-0.5 rounded-t-(--radius-lg) bg-(--surface-fixed-light) px-3 pb-3 pt-3">
          <h3 className="truncate text-(length:--text-sm) font-medium text-(--color-neutral-600)">
            {item.name_en}
          </h3>
          <span
            className={`font-(family-name:--font-display) text-(length:--text-xl) leading-(--leading-tight) tracking-(--tracking-tight) ${
              isAvailable ? "text-(--color-accent-600)" : "text-(--color-neutral-400)"
            }`}
          >
            {hasSizes ? `From ${formatPrice(displayPrice)}` : formatPrice(displayPrice)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
});
