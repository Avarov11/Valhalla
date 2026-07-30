"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Plus } from "@phosphor-icons/react";
import type { MenuItemRow } from "@/lib/menu/types";
import { formatPrice } from "@/lib/menu/format";
import { useCartContext } from "@/lib/cart/cart-context";

type MenuItemCardProps = {
  item: MenuItemRow;
};

/**
 * Card geometry (aspect ratio, object-fit, border-radius, outer padding,
 * grid columns and gap in MenuSection.tsx) is measured off the old
 * site's own live cards at 390/768/1024/1440, not designed from scratch
 * a second time: the photos were authored for that geometry, ours
 * cutting into them was a sizing mismatch, not a taste difference.
 * Nothing else came from there, palette/type/shadow/surface/layout stay
 * exactly as built. Image is a flat 1:1 (confirmed on the reference at
 * every one of the four widths), object-cover, zero radius of its own,
 * card itself is border-radius: 16px, zero own padding, the outer clip
 * handles the top corners so the image doesn't need its own rounding.
 *
 * No overlap: image and footer stack flush, no negative margin pulling
 * the footer up into the photo. The overlap was our own addition
 * (approved rows had -mt-7 to mask the template's white wave under a
 * fixed light plate), and it was cutting into product on every photo
 * that isn't the pink-wave template, which is most of the corpus.
 * Footer is back to the page's own theme-reactive tokens, not a fixed
 * light plate, since there's no wave-matching problem left to solve
 * that way.
 *
 * Frame's approved sibling-button architecture is back: the whole card
 * is a Link (absolute, full-bleed, z-0) for the "view detail" case, and
 * a separate FAB (z-20, straddling the image's own bottom edge so it
 * lands on the photo/footer seam regardless of footer height) handles
 * the "quick add" case for flat-price items, or opens the detail sheet
 * for sized ones, since there's no single price to add directly.
 * Siblings, not nested, so there's no click-target conflict and no
 * stopPropagation dependency for correctness (kept anyway as a second
 * layer). Disabled state is the FAB's own native `disabled` attribute
 * when the item is unavailable, not a class-only fake.
 */
export const MenuItemCard = memo(function MenuItemCard({ item }: MenuItemCardProps) {
  const router = useRouter();
  const cart = useCartContext();
  const hasSizes = item.item_sizes.length > 0;
  const displayPrice = hasSizes
    ? Math.min(...item.item_sizes.map((s) => s.price))
    : (item.price ?? 0);
  const isAvailable = item.is_available;

  function handleFabClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (hasSizes) {
      router.push(`/item/${item.id}`);
    } else {
      cart.addItem(item.id, null, 1);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: isAvailable ? 1 : 0.65, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-2xl bg-(--bg-surface) ${isAvailable ? "shadow-(--shadow-card)" : "shadow-(--shadow-md)"}`}
    >
      <Link
        href={`/item/${item.id}`}
        aria-label={`View ${item.name_en}, ${hasSizes ? "from " : ""}${formatPrice(displayPrice)}${!isAvailable ? ", sold out" : ""}`}
        className="absolute inset-0 z-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--accent-ring) focus-visible:outline-offset-[-2px]"
      />

      <div className="pointer-events-none relative aspect-square w-full bg-(--bg-unavailable)">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name_en}
            fill
            sizes="(max-width: 767px) 50vw, (max-width: 1023px) 25vw, 20vw"
            className={`object-cover ${isAvailable ? "" : "opacity-60"}`}
          />
        ) : null}

        {item.is_popular && isAvailable ? (
          <span className="absolute left-3 top-3 rounded-(--radius-pill) bg-(--accent-solid) px-2.5 py-1 text-(length:--text-xs) font-semibold uppercase tracking-(--tracking-wide) text-(--text-on-accent)">
            Popular
          </span>
        ) : null}

        {!isAvailable ? (
          <span className="absolute right-3 top-3 rounded-(--radius-pill) border border-(--border-strong) bg-(--bg-surface) px-2 py-0.5 text-(length:--text-xs) font-medium text-(--text-secondary)">
            Sold out
          </span>
        ) : null}

        {/*
          -bottom-6 here refers to THIS image div's own bottom edge (it
          is the nearest positioned ancestor), which is exactly the
          image/footer seam, not the outer card's overall bottom edge
          past the footer text. pointer-events-auto overrides the
          image wrapper's own pointer-events-none, since a FAB inside a
          click-through area still needs to be clickable itself.
        */}
        <button
          type="button"
          onClick={handleFabClick}
          disabled={!isAvailable}
          aria-label={
            !isAvailable
              ? `${item.name_en} is sold out`
              : hasSizes
                ? `Choose a size for ${item.name_en}`
                : `Add ${item.name_en} to cart`
          }
          className="pointer-events-auto absolute -bottom-6 right-3 z-20 flex h-11 w-11 items-center justify-center rounded-(--radius-pill) bg-(--accent-solid) text-(--text-on-accent) shadow-(--shadow-lg) transition duration-(--duration-fast) hover:bg-(--accent-solid-hover) active:scale-95 disabled:bg-(--bg-unavailable) disabled:text-(--text-muted) disabled:shadow-none"
        >
          <Plus size={20} weight="bold" />
        </button>
      </div>

      <div className="pointer-events-none flex flex-col gap-0.5 px-3 pb-3 pt-2.5">
        <h3 className="truncate text-(length:--text-sm) font-medium text-(--text-secondary)">
          {item.name_en}
        </h3>
        <span
          className={`font-(family-name:--font-display) text-(length:--text-xl) leading-(--leading-tight) tracking-(--tracking-tight) ${
            isAvailable ? "text-(--accent-text)" : "text-(--text-muted)"
          }`}
        >
          {hasSizes ? `From ${formatPrice(displayPrice)}` : formatPrice(displayPrice)}
        </span>
      </div>
    </motion.div>
  );
});
