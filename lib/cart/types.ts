/**
 * What actually lives in localStorage: item id, size label, selected
 * addon option ids, quantity. Nothing else. Prices and names (item,
 * size, or addon) are never persisted, they're resolved from live
 * Supabase data every time the cart renders, see resolve.ts. This is
 * deliberate: a cart that sat in a browser for weeks must never send
 * an order at weeks-old prices, and that now covers addon surcharges
 * too, not just the base/size price.
 *
 * addonOptionIds must be stored sorted: it doubles as part of a cart
 * line's identity (two lines for the same item+size but a different
 * addon selection are genuinely different lines, not merge candidates),
 * and an unsorted array would make the same actual selection compare
 * as different depending on click order. See use-cart.ts's addItem.
 */
export type CartLine = {
  itemId: string;
  sizeLabel: string | null;
  addonOptionIds: string[];
  quantity: number;
};

export type ResolvedAddon = {
  optionId: string;
  name: string;
  priceDelta: number;
};

export type ResolvedCartLine = {
  itemId: string;
  sizeLabel: string | null;
  addonOptionIds: string[];
  addons: ResolvedAddon[];
  quantity: number;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  lineTotal: number;
};

/**
 * Carries addonOptionIds too, not just itemId + sizeLabel: two
 * distinct cart lines can share the same item and size but differ only
 * in addons (one plain, one with extra sauce), and dropping one must
 * not sweep up the other. See use-cart.ts's cleanup effect.
 */
export type RemovedNotice = {
  itemId: string;
  sizeLabel: string | null;
  addonOptionIds: string[];
  reason: "deleted" | "unavailable" | "size-changed" | "addon-changed";
  name: string;
};
