import type { Menu } from "@/lib/menu/types";
import type { CartLine, RemovedNotice, ResolvedCartLine } from "@/lib/cart/types";

/**
 * Resolves stored cart lines (item id, size label, quantity) against the
 * current, live menu data. Never trusts a stored price or name. A line
 * whose item was deleted, is now unavailable, or whose size no longer
 * exists gets dropped, with a plain-language note about what happened
 * and why, rather than silently disappearing or crashing on stale data.
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
        reason: "deleted",
        name: "An item",
      });
      continue;
    }

    if (!item.is_available) {
      removed.push({
        itemId: line.itemId,
        sizeLabel: line.sizeLabel,
        reason: "unavailable",
        name: item.name_en,
      });
      continue;
    }

    let unitPrice: number;

    if (item.item_sizes.length > 0) {
      const size = item.item_sizes.find((s) => s.label === line.sizeLabel);
      if (!size) {
        removed.push({
          itemId: line.itemId,
          sizeLabel: line.sizeLabel,
          reason: "size-changed",
          name: item.name_en,
        });
        continue;
      }
      unitPrice = size.price;
    } else {
      if (line.sizeLabel !== null || item.price === null) {
        removed.push({
          itemId: line.itemId,
          sizeLabel: line.sizeLabel,
          reason: "size-changed",
          name: item.name_en,
        });
        continue;
      }
      unitPrice = item.price;
    }

    resolved.push({
      itemId: item.id,
      sizeLabel: line.sizeLabel,
      quantity: line.quantity,
      name: item.name_en,
      imageUrl: item.image_url,
      unitPrice,
      lineTotal: unitPrice * line.quantity,
    });
  }

  return { resolved, removed };
}
