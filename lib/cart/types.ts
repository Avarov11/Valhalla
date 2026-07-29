/**
 * What actually lives in localStorage: item id, size label, quantity.
 * Nothing else. Prices and names are never persisted, they're resolved
 * from live Supabase data every time the cart renders, see resolve.ts.
 * This is deliberate: a cart that sat in a browser for weeks must never
 * send an order at weeks-old prices.
 */
export type CartLine = {
  itemId: string;
  sizeLabel: string | null;
  quantity: number;
};

export type ResolvedCartLine = {
  itemId: string;
  sizeLabel: string | null;
  quantity: number;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  lineTotal: number;
};

export type RemovedNotice = {
  itemId: string;
  sizeLabel: string | null;
  reason: "deleted" | "unavailable" | "size-changed";
  name: string;
};
