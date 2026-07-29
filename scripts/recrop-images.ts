import { config } from "dotenv";
config({ path: ".env.local" });

import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "menu-images";
const LONG_SIDE = 1200;
const WEBP_QUALITY = 85;

// Kept in sync with lib/menu/category-aspect.ts by hand (this script runs
// standalone via tsx, outside the Next.js path-alias resolution the app
// itself uses, so it isn't imported directly). Width / height, measured
// from the real source photos, not one universal square: see that file's
// comment for the full reasoning and the per-category sample sizes.
const CATEGORY_ASPECT: Record<string, number> = {
  "sweet-cones": 1,
  "sweet-classic": 1.25,
  savory: 1,
  extras: 1,
  pizza: 1,
  milkshakes: 0.91,
  mojitos: 0.91,
  smoothies: 0.67,
  yogurt: 0.67,
  juice: 0.67,
  "hot-drinks": 1,
  "hot-coffee": 1,
  "cold-coffee": 1,
  bakery: 0.67,
  cakes: 0.8,
};
const DEFAULT_ASPECT = 1;

function targetDimensions(aspect: number): { width: number; height: number } {
  if (aspect >= 1) {
    return { width: LONG_SIDE, height: Math.round(LONG_SIDE / aspect) };
  }
  return { width: Math.round(LONG_SIDE * aspect), height: LONG_SIDE };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

/**
 * Re-crops every menu item photo already in storage to its category's
 * own aspect ratio, in place (same storage path, same public URL, no
 * menu_items.image_url update needed).
 *
 * Started as a single universal 1200x1200 square for every item. Real
 * measurement of the source photos showed that was fighting the
 * photography rather than matching it: sweet-classic's chimney rolls
 * are 1.25 wide-to-tall on every one of its 9 items, milkshakes' jars
 * are 0.91 on every one of its 7, pizza is 1.00 on all 11. Forcing all
 * of that into one square meant cropping into rolls on the sides, or
 * needing extra logic just to protect a product name baked into the
 * top of a drink photo. Per-category targets, still content-aware
 * within that shape (see below), fit the dominant photo shape in each
 * category directly instead.
 *
 * sharp's attention strategy is content-aware (libvips saliency
 * detection), not a fixed anchor point, so within whatever shape a
 * category targets, individual items whose own photo doesn't match
 * that category's typical aspect (extras, smoothies, hot-coffee, and a
 * few others have real internal variance, see category-aspect.ts) still
 * get cropped around what's actually salient in that specific image.
 *
 * Run again if new items get added, or if CATEGORY_ASPECT changes (keep
 * it in sync with lib/menu/category-aspect.ts by hand).
 */
async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  const { data: items, error } = await supabase
    .from("menu_items")
    .select("id, name_en, image_url, categories(slug)")
    .not("image_url", "is", null);

  if (error) {
    throw new Error(`Failed to list menu items: ${error.message}`);
  }

  // Group by (image_url, target aspect) rather than image_url alone:
  // the same source photo is never shared across two different
  // categories in this catalogue, but grouping this way is correct even
  // if that ever changed, since two categories could want different
  // crops of the same source image.
  type Row = (typeof items)[number];
  const groups = new Map<string, { imageUrl: string; aspect: number; refs: Row[] }>();

  for (const item of items) {
    const slug = (item.categories as unknown as { slug: string } | null)?.slug ?? "";
    const aspect = CATEGORY_ASPECT[slug] ?? DEFAULT_ASPECT;
    const key = `${item.image_url}::${aspect}`;
    const group = groups.get(key) ?? { imageUrl: item.image_url!, aspect, refs: [] as Row[] };
    group.refs.push(item);
    groups.set(key, group);
  }

  console.log(`${items.length} items, ${groups.size} unique (image, aspect) groups.`);

  let uploaded = 0;
  const failures: { name: string; error: string }[] = [];

  for (const { imageUrl, aspect, refs } of groups.values()) {
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`fetch failed: HTTP ${res.status}`);
      const original = Buffer.from(await res.arrayBuffer());

      const { width, height } = targetDimensions(aspect);
      const cropped = await sharp(original)
        .resize(width, height, { fit: "cover", position: sharp.strategy.attention })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      for (const ref of refs) {
        const marker = `/object/public/${BUCKET}/`;
        const idx = imageUrl.indexOf(marker);
        if (idx === -1) throw new Error(`unexpected image_url shape: ${imageUrl}`);
        const storagePath = imageUrl.slice(idx + marker.length);

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, cropped, { contentType: "image/webp", upsert: true });

        if (uploadError) throw uploadError;
        uploaded += 1;
      }
    } catch (err) {
      for (const ref of refs) {
        const slug = (ref.categories as unknown as { slug: string } | null)?.slug ?? "?";
        failures.push({ name: `${slug}/${ref.name_en}`, error: (err as Error).message });
      }
    }
  }

  console.log(`\nre-cropped and uploaded: ${uploaded} / ${items.length}`);

  if (failures.length > 0) {
    console.log(`\n${failures.length} failure(s):`);
    for (const failure of failures) {
      console.log(`  ${failure.name}: ${failure.error}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
