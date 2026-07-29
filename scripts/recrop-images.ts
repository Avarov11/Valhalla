import { config } from "dotenv";
config({ path: ".env.local" });

import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "menu-images";
const TARGET = 1200;
const WEBP_QUALITY = 85;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

/**
 * Re-crops every menu item photo already in storage to a genuine
 * 1200x1200 square, in place (same storage path, same public URL, no
 * menu_items.image_url update needed).
 *
 * Exists because CSS-only fixes on the display side (a square frame via
 * aspect-square, object-top, object-contain) each traded one category's
 * crop problem for another: the corpus has too much real composition
 * variance (1:1 cone shots, 1.25:1 chimney rolls, ~0.91:1 drink jars
 * with a product name baked into the top of the frame in script) for
 * any single fixed rule to protect every category watching over it.
 *
 * sharp's attention strategy is content-aware (libvips saliency
 * detection), not a fixed anchor point, so it crops each photo based on
 * what's actually salient in that specific image rather than one rule
 * applied uniformly to a corpus that was never uniform to begin with.
 * Run it again if new items get added with non-square source photos.
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

  // Several items share one source photo (nine, per CLAUDE.md), no need
  // to download and re-crop the same image more than once.
  const byUrl = new Map<string, typeof items>();
  for (const item of items) {
    const list = byUrl.get(item.image_url!) ?? [];
    list.push(item);
    byUrl.set(item.image_url!, list);
  }

  console.log(`${items.length} items, ${byUrl.size} unique source images.`);

  let uploaded = 0;
  const failures: { name: string; error: string }[] = [];

  for (const [imageUrl, refs] of byUrl) {
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`fetch failed: HTTP ${res.status}`);
      const original = Buffer.from(await res.arrayBuffer());

      const cropped = await sharp(original)
        .resize(TARGET, TARGET, { fit: "cover", position: sharp.strategy.attention })
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
        failures.push({ name: `${ref.categories?.[0]?.slug}/${ref.name_en}`, error: (err as Error).message });
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
