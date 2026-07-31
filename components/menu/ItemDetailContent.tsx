"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { m } from "motion/react";
import { Minus, Plus } from "@phosphor-icons/react";
import type { AddonGroup, MenuItemRow } from "@/lib/menu/types";
import { formatPrice } from "@/lib/menu/format";
import { useCartContext } from "@/lib/cart/cart-context";

/**
 * Toggles one option into/out of the selected set. Groups with
 * allows_multiple false (none on the old site today, but the schema
 * supports it) behave like a radio group instead of checkboxes: picking
 * an option in that group clears any other selection from the same
 * group first, so at most one survives.
 */
function toggleAddon(current: Set<string>, group: AddonGroup, optionId: string): Set<string> {
  const next = new Set(current);
  if (next.has(optionId)) {
    next.delete(optionId);
    return next;
  }
  if (!group.allows_multiple) {
    for (const option of group.item_addon_options) {
      next.delete(option.id);
    }
  }
  next.add(optionId);
  return next;
}

/**
 * The actual detail UI, shared between the two routes that show it: the
 * real standalone page at /item/[id] (deep-linkable, so a single item can
 * be dropped into a WhatsApp conversation) and the intercepted modal
 * version rendered over the grid when navigated to from within the app
 * (app/@modal/(.)item/[id]). Both wrap this in their own chrome, this
 * component only owns image, name, description, size selection, addon
 * selection, quantity and the add-to-cart action.
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
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);

  const isAvailable = item.is_available;
  const basePrice = hasSizes
    ? (item.item_sizes.find((s) => s.label === selectedSize)?.price ?? item.item_sizes[0].price)
    : (item.price ?? 0);
  const addonTotal = item.item_addon_groups
    .flatMap((group) => group.item_addon_options)
    .filter((option) => selectedAddonIds.has(option.id))
    .reduce((sum, option) => sum + option.price_delta, 0);
  const unitPrice = basePrice + addonTotal;

  function handleAdd() {
    cart.addItem(item.id, selectedSize, Array.from(selectedAddonIds), quantity);
    onAdded?.();
  }

  return (
    <div className="flex flex-col">
      {/* 1:1 box, object-contain not cover, --bg-photo-panel letterbox: see
          MenuItemCard.tsx's card-geometry comment, same rule here. */}
      <div className="relative aspect-square w-full shrink-0 bg-(--bg-photo-panel)">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name_en}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 32rem"
            className={`object-contain ${isAvailable ? "" : "opacity-50"}`}
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
            {formatPrice(basePrice)}
          </p>
        )}

        {/* Addon options are --radius-md cards, not --radius-pill: a
            deliberate, scoped exception to the "interactive = pill,
            always" rule (see globals.css and CLAUDE.md). A pill shape
            reads fine for the size selector's short single-line "Label
            · Price" pills, but addon groups run 4-11 longer-named
            options each (see item_addons_schema.sql seed data), and a
            wrapped row of variable-width single-line pills got messy
            fast. Two-line name/price cards in a fixed 2-column grid,
            matching the old site's own real UI for this exact control,
            scans far better at that count. */}
        {item.item_addon_groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-(length:--text-sm) font-medium text-(--text-primary)">
                {group.name_en}
              </span>
              <span className="text-(length:--text-xs) text-(--text-muted)">
                {group.is_required ? "Required" : "Optional"}
              </span>
            </div>
            <div
              role={group.allows_multiple ? "group" : "radiogroup"}
              aria-label={group.name_en}
              className="grid grid-cols-2 gap-2"
            >
              {group.item_addon_options.map((option) => {
                const selected = selectedAddonIds.has(option.id);
                const optionDisabled = !isAvailable || !option.is_available;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role={group.allows_multiple ? "checkbox" : "radio"}
                    aria-checked={selected}
                    disabled={optionDisabled}
                    aria-disabled={optionDisabled}
                    onClick={() =>
                      setSelectedAddonIds((current) => toggleAddon(current, group, option.id))
                    }
                    className={`flex min-h-11 flex-col items-start justify-center gap-0.5 rounded-(--radius-md) border px-3 py-2 text-left transition duration-(--duration-fast) active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${
                      selected
                        ? "border-(--accent-solid) bg-(--accent-subtle-bg)"
                        : "border-(--accent-border-subtle)"
                    }`}
                  >
                    <span
                      className={`text-(length:--text-sm) font-medium ${selected ? "text-(--accent-text)" : "text-(--text-primary)"}`}
                    >
                      {option.name_en}
                    </span>
                    <span
                      className={`text-(length:--text-xs) ${selected ? "text-(--accent-text)" : "text-(--text-muted)"}`}
                    >
                      {option.is_available ? `+ ${formatPrice(option.price_delta)}` : "Sold out"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

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
            <m.span
              key={quantity}
              initial={{ scale: 1.25 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-6 text-center text-(length:--text-md) text-(--text-primary)"
            >
              {quantity}
            </m.span>
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
