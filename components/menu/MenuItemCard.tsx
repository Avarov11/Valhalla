"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { m } from "motion/react";
import { Plus, Star } from "@phosphor-icons/react";
import type { MenuItemRow } from "@/lib/menu/types";
import { formatPrice } from "@/lib/menu/format";
import { useCartContext } from "@/lib/cart/cart-context";

type MenuItemCardProps = {
  item: MenuItemRow;
};

/**
 * REDESIGN (2026-07-31, explicit request after being told the
 * conflict): this card now deliberately matches the "delivery-app
 * card" shape REDESIGN.md's banned-patterns list names outright
 * (rounded rectangle, photo on top, name, description, price, a
 * button in a row) and brings description back onto the grid card
 * after it was deliberately dropped for scannability. Both reversed on
 * purpose, by request, not silently. The one thing that request could
 * NOT get was fake data: no star rating renders unless
 * rating_count > 0, real owner-entered numbers only (see the
 * 20260731165248 migration and CLAUDE.md, "do not invent... review
 * counts" still holds, only the fabrication is off the table, not the
 * feature).
 *
 * Image box is still a flat 1:1, object-contain not object-cover, so
 * the whole stored image always shows and nothing is cropped. Now
 * inset with its own padding and --radius-lg corners (the documented
 * "item photos -> radius-lg" rule) rather than flush to the card
 * edges, so the pink card border reads as a frame around the photo,
 * not a border butted against it.
 *
 * Card border is --accent-border-subtle (the same token addon option
 * cards use), one line, not doubled: paired with only --shadow-sm, not
 * the rose-tinted --shadow-card glow from before, since a colored
 * glow stacked under a colored border is exactly the "double frame"
 * look this was asked to avoid.
 *
 * Still the sibling-button architecture, not nested interactive
 * elements: the whole card is a Link (absolute, full-bleed, z-0) for
 * "view detail", the Add to Cart button is a separate sibling (z-20)
 * with its own stopPropagation. It's just a full-width bar at the
 * bottom now instead of a circular FAB straddling the photo/footer
 * seam, matching the reference. Sized items still route to the detail
 * page instead of adding directly (a size has to be chosen, there's
 * no default price to quick-add at), the button label stays "Add to
 * Cart" either way for visual consistency with the reference, even
 * though sized items navigate rather than add.
 *
 * Price sits inline with the name, same row, name truncating and price
 * shrink-0 so a long name never pushes the price off the card
 * (2026-07-31: briefly a floating badge on the photo matching the
 * reference's "$20" tag, moved back to the name row by request). Sold
 * out still shows as a badge on the photo top-right, Popular stays
 * top-left; with price off the photo now, available items simply show
 * no badge in that top-right slot instead of a price tag there.
 *
 * Description is line-clamped to 2 lines: 134 items have wildly
 * different description lengths, and an unclamped one would break
 * grid row-height consistency across a category. This is a practical
 * constraint of shipping the request at 134-item scale, not a
 * reopening of whether description belongs here at all.
 *
 * Both navigations into /item/[id] still pass `scroll: false`: this
 * route is always intercepted into the overlay modal from here
 * (app/@modal), the grid behind it must stay exactly where it was.
 */
export const MenuItemCard = memo(function MenuItemCard({ item }: MenuItemCardProps) {
  const router = useRouter();
  const cart = useCartContext();
  const hasSizes = item.item_sizes.length > 0;
  const displayPrice = hasSizes
    ? Math.min(...item.item_sizes.map((s) => s.price))
    : (item.price ?? 0);
  const isAvailable = item.is_available;

  const hasRating = item.rating_count > 0 && item.rating_average !== null;

  function handleAddClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (hasSizes) {
      router.push(`/item/${item.id}`, { scroll: false });
    } else {
      cart.addItem(item.id, null, [], 1);
    }
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: isAvailable ? 1 : 0.65, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-(--accent-border-subtle) bg-(--bg-surface) shadow-(--shadow-sm)"
    >
      <Link
        href={`/item/${item.id}`}
        scroll={false}
        aria-label={`View ${item.name_en}, ${hasSizes ? "from " : ""}${formatPrice(displayPrice)}${!isAvailable ? ", sold out" : ""}`}
        className="absolute inset-0 z-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--accent-ring) focus-visible:outline-offset-[-2px]"
      />

      <div className="pointer-events-none p-2.5 pb-0">
        <div className="relative aspect-square w-full overflow-hidden rounded-(--radius-lg) bg-(--bg-photo-panel)">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name_en}
              fill
              sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 20vw"
              className={`object-contain ${isAvailable ? "" : "opacity-60"}`}
            />
          ) : null}

          {item.is_popular && isAvailable ? (
            <span className="absolute left-2 top-2 rounded-(--radius-pill) bg-(--accent-solid) px-2.5 py-1 text-(length:--text-xs) font-semibold uppercase tracking-(--tracking-wide) text-(--text-on-accent)">
              Popular
            </span>
          ) : null}

          {!isAvailable ? (
            <span className="absolute right-2 top-2 rounded-(--radius-pill) border border-(--border-strong) bg-(--bg-surface) px-2 py-0.5 text-(length:--text-xs) font-medium text-(--text-secondary)">
              Sold out
            </span>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none flex flex-col gap-1 px-3 pb-3 pt-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-(length:--text-sm) font-medium text-(--text-primary)">
            {item.name_en}
          </h3>
          <span
            className={`shrink-0 text-(length:--text-sm) font-semibold ${isAvailable ? "text-(--accent-text)" : "text-(--text-muted)"}`}
          >
            {hasSizes ? `From ${formatPrice(displayPrice)}` : formatPrice(displayPrice)}
          </span>
        </div>
        {item.description ? (
          <p className="line-clamp-2 text-(length:--text-xs) leading-(--leading-normal) text-(--text-secondary)">
            {item.description}
          </p>
        ) : null}

        {hasRating ? (
          <div className="flex items-center gap-1 pt-0.5" aria-label={`Rated ${item.rating_average} out of 5 from ${item.rating_count} review${item.rating_count === 1 ? "" : "s"}`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                weight={i < Math.round(item.rating_average!) ? "fill" : "regular"}
                className="text-(--accent-text)"
                aria-hidden="true"
              />
            ))}
            <span className="text-(length:--text-xs) text-(--text-muted)">({item.rating_count})</span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleAddClick}
          disabled={!isAvailable}
          aria-label={
            !isAvailable
              ? `${item.name_en} is sold out`
              : hasSizes
                ? `Choose a size for ${item.name_en}`
                : `Add ${item.name_en} to cart`
          }
          className="pointer-events-auto relative z-20 mt-1 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-(--radius-pill) bg-(--accent-solid) text-(length:--text-sm) font-semibold text-(--text-on-accent) transition duration-(--duration-fast) hover:bg-(--accent-solid-hover) active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-(--bg-unavailable) disabled:text-(--text-muted)"
        >
          <Plus size={16} weight="bold" />
          {isAvailable ? "Add to Cart" : "Sold out"}
        </button>
      </div>
    </m.div>
  );
});
