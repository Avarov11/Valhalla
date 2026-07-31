import type { CartLine } from "@/lib/cart/types";

/**
 * The version lives in the key name itself. Bumping it (v1 -> v2) when
 * the stored shape changes means old carts are simply never read back,
 * rather than being parsed into a shape the app no longer expects.
 * Bumped to v2 for addonOptionIds (item add-ons feature): a v1 cart
 * has no such field, and reading it back as CartLine[] without this
 * bump would silently treat every stored line as having zero addons
 * rather than actually losing information the user can't see, this is
 * the "invalidate instead of guess" case the versioned key exists for.
 */
const STORAGE_KEY = "valhalla-cart-v2";

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.itemId === "string" &&
    v.itemId.length > 0 &&
    (v.sizeLabel === null || typeof v.sizeLabel === "string") &&
    Array.isArray(v.addonOptionIds) &&
    v.addonOptionIds.every((id) => typeof id === "string" && id.length > 0) &&
    typeof v.quantity === "number" &&
    Number.isFinite(v.quantity) &&
    v.quantity > 0
  );
}

export function readCartLines(): CartLine[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isCartLine)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function writeCartLines(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
}
