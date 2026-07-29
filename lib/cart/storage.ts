import type { CartLine } from "@/lib/cart/types";

/**
 * The version lives in the key name itself. Bumping it (v1 -> v2) when
 * the stored shape changes means old carts are simply never read back,
 * rather than being parsed into a shape the app no longer expects.
 */
const STORAGE_KEY = "valhalla-cart-v1";

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.itemId === "string" &&
    v.itemId.length > 0 &&
    (v.sizeLabel === null || typeof v.sizeLabel === "string") &&
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
