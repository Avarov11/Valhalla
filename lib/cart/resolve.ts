import type { Menu, MenuItemRow } from "@/lib/menu/types";
import type { CartLine, RemovedNotice, ResolvedAddon, ResolvedCartLine } from "@/lib/cart/types";

/**
 * Resolved in the item's own group/option order, not the stored
 * addonOptionIds order (that array is kept sorted for cart-line
 * identity, not display, see cart/types.ts). Returns null instead of a
 * partial list if any selected option no longer exists or has gone
 * unavailable, the caller drops the whole line in that case rather
 * than silently shipping an order that's missing an extra the
 * customer actually picked.
 */
function resolveAddons(item: MenuItemRow, selectedOptionIds: string[]): ResolvedAddon[] | null {
  if (selectedOptionIds.length === 0) return [];

  const selected = new Set(selectedOptionIds);
  const found: ResolvedAddon[] = [];

  for (const group of item.item_addon_groups) {
    for (const option of group.item_addon_options) {
      if (!selected.has(option.id)) continue;
      if (!option.is_available) return null;
      found.push({ optionId: option.id, name: option.name_en, priceDelta: option.price_delta });
    }
  }

  return found.length === selectedOptionIds.length ? found : null;
}

/**
 * Resolves stored cart lines (item id, size label, addon option ids,
 * quantity) against the current, live menu data. Never trusts a stored
 * price or name, for the base item, the size, or an addon. A line
 * whose item was deleted, is now unavailable, whose size no longer
 * exists, or whose addon selection no longer fully resolves gets
 * dropped, with a plain-language note about what happened and why,
 * rather than silently disappearing, silently shipping a different
 * order than what was configured, or crashing on stale data.
 */
export function resolveCartLines(
  lines: CartLine[],
  menu: Menu,
): { resolved: ResolvedCartLine[]; removed: RemovedNotice[] } {
  const itemsById = new Map(menu.flatMap((category) => category.menu_items.map((item) => [item.id, item])));

  const resolved: ResolvedCartLine[] = [];
  const removed: RemovedNotice[] = [];

  for (const line of lines) {
    const item = itemsById.get(line.itemId);

    if (!item) {
      removed.push({
        itemId: line.itemId,
        sizeLabel: line.sizeLabel,
        addonOptionIds: line.addonOptionIds,
        reason: "deleted",
        name: "An item",
      });
      continue;
    }

    if (!item.is_available) {
      removed.push({
        itemId: line.itemId,
        sizeLabel: line.sizeLabel,
        addonOptionIds: line.addonOptionIds,
        reason: "unavailable",
        name: item.name_en,
      });
      continue;
    }

    let basePrice: number;

    if (item.item_sizes.length > 0) {
      const size = item.item_sizes.find((s) => s.label === line.sizeLabel);
      if (!size) {
        removed.push({
          itemId: line.itemId,
          sizeLabel: line.sizeLabel,
          addonOptionIds: line.addonOptionIds,
          reason: "size-changed",
          name: item.name_en,
        });
        continue;
      }
      basePrice = size.price;
    } else {
      if (line.sizeLabel !== null || item.price === null) {
        removed.push({
          itemId: line.itemId,
          sizeLabel: line.sizeLabel,
          addonOptionIds: line.addonOptionIds,
          reason: "size-changed",
          name: item.name_en,
        });
        continue;
      }
      basePrice = item.price;
    }

    const addons = resolveAddons(item, line.addonOptionIds);
    if (addons === null) {
      removed.push({
        itemId: line.itemId,
        sizeLabel: line.sizeLabel,
        addonOptionIds: line.addonOptionIds,
        reason: "addon-changed",
        name: item.name_en,
      });
      continue;
    }

    const unitPrice = basePrice + addons.reduce((sum, a) => sum + a.priceDelta, 0);

    resolved.push({
      itemId: item.id,
      sizeLabel: line.sizeLabel,
      addonOptionIds: line.addonOptionIds,
      addons,
      quantity: line.quantity,
      name: item.name_en,
      imageUrl: item.image_url,
      unitPrice,
      lineTotal: unitPrice * line.quantity,
    });
  }

  return { resolved, removed };
}
