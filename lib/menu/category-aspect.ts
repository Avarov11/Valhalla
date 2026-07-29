/**
 * Per-category image aspect ratio (width / height), not one universal
 * square across all 15 categories. Measured the real source photos
 * (sharp against the original uploads, before any of our own cropping):
 * most categories cluster tightly around one shape (sweet-classic's
 * chimney rolls are 1.25 on all 9 items, milkshakes' jars are 0.91 on
 * all 7), so forcing a single square frame meant fighting the source
 * photography instead of matching it. Consistent within a category
 * (every card in one grid section shares the same shape, rows stay
 * aligned), matched to the category's own dominant shape rather than
 * fixed globally.
 *
 * Mixed categories (extras, smoothies, hot-coffee, etc, where individual
 * items range from ~0.5 to ~1.8) use their median rather than an outlier,
 * and lean on scripts/recrop-images.ts's attention-based crop to handle
 * the items that don't match the category's typical shape.
 */
export const CATEGORY_ASPECT: Record<string, number> = {
  "sweet-cones": 1, // median 1.00 (n=10)
  "sweet-classic": 1.25, // median 1.25 (n=9, every item)
  savory: 1, // median 1.00 (n=11)
  extras: 1, // median 1.00 (n=13, wide range)
  pizza: 1, // median 1.00 (n=11, every item)
  milkshakes: 0.91, // median 0.91 (n=7, every item)
  mojitos: 0.91, // median 0.91 (n=8)
  smoothies: 0.67, // median 0.67 (n=9, wide range)
  yogurt: 0.67, // median 0.67 (n=10, wide range)
  juice: 0.67, // median 0.67 (n=9, wide range)
  "hot-drinks": 1, // median 1.00 (n=8, wide range)
  "hot-coffee": 1, // median 1.00 (n=14, wide range)
  "cold-coffee": 1, // median 0.99 (n=9)
  bakery: 0.67, // median 0.67 (n=3)
  cakes: 0.8, // median 0.80 (n=3)
};

const DEFAULT_ASPECT = 1;

export function categoryAspect(slug: string): number {
  return CATEGORY_ASPECT[slug] ?? DEFAULT_ASPECT;
}
