import { config } from "dotenv";
config({ path: ".env.local" });

import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "menu-images";
const TARGET = 1200;
const WEBP_QUALITY = 85;

// A row/column counts as "content" if enough individual pixels differ
// from the background colour by enough, not the row's average: thin
// content near an edge (turkey curls poking above a sandwich, a cone's
// whipped-cream peak) doesn't move a whole-row average far past a flat
// background colour, but it is real product and an average-based trim
// crops straight through it.
const PIXEL_THRESHOLD = 30;
const COUNT_FRACTION = 0.02;
// Only trim when it removes a plausible amount of flat background, not
// a near-no-op (already-tight photo) or a degenerate sliver (a busy
// lifestyle shot with no flat backdrop at all, where this detection
// isn't meaningful).
const MIN_TRIM_AREA_RATIO = 0.15;
const MAX_TRIM_AREA_RATIO = 0.85;
// Generous, asymmetric padding back around the detected box, sized off
// the full image rather than the box itself: irregular product edges
// need real headroom, not a small proportional buffer.
const PAD_TOP = 0.15;
const PAD_BOTTOM = 0.08;
const PAD_SIDE = 0.08;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function findContentBox(buf: Buffer) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const bg = [data[0], data[1], data[2]];

  function rowHasContent(y: number): boolean {
    let count = 0;
    const step = 2;
    const total = Math.ceil(width / step);
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * channels;
      const dr = data[idx] - bg[0],
        dg = data[idx + 1] - bg[1],
        db = data[idx + 2] - bg[2];
      if (Math.sqrt(dr * dr + dg * dg + db * db) > PIXEL_THRESHOLD) count++;
    }
    return count / total > COUNT_FRACTION;
  }

  function colHasContent(x: number): boolean {
    let count = 0;
    const step = 2;
    const total = Math.ceil(height / step);
    for (let y = 0; y < height; y += step) {
      const idx = (y * width + x) * channels;
      const dr = data[idx] - bg[0],
        dg = data[idx + 1] - bg[1],
        db = data[idx + 2] - bg[2];
      if (Math.sqrt(dr * dr + dg * dg + db * db) > PIXEL_THRESHOLD) count++;
    }
    return count / total > COUNT_FRACTION;
  }

  let top = 0,
    bottom = height - 1,
    left = 0,
    right = width - 1;
  while (top < height && !rowHasContent(top)) top++;
  while (bottom > top && !rowHasContent(bottom)) bottom--;
  while (left < width && !colHasContent(left)) left++;
  while (right > left && !colHasContent(right)) right--;

  return { top, bottom, left, right, width, height };
}

async function smartCrop(original: Buffer): Promise<Buffer> {
  const box = await findContentBox(original);
  const boxW = box.right - box.left;
  const boxH = box.bottom - box.top;
  const areaRatio = (boxW * boxH) / (box.width * box.height);

  let source = original;
  if (areaRatio > MIN_TRIM_AREA_RATIO && areaRatio < MAX_TRIM_AREA_RATIO) {
    const padTop = Math.round(box.height * PAD_TOP);
    const padBottom = Math.round(box.height * PAD_BOTTOM);
    const padSide = Math.round(box.width * PAD_SIDE);
    const left = Math.max(0, box.left - padSide);
    const top = Math.max(0, box.top - padTop);
    const right = Math.min(box.width, box.right + padSide);
    const bottom = Math.min(box.height, box.bottom + padBottom);
    source = await sharp(original)
      .extract({ left, top, width: right - left, height: bottom - top })
      .toBuffer();
  }

  return sharp(source)
    .resize(TARGET, TARGET, { fit: "cover", position: sharp.strategy.attention })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

/**
 * Re-crops every menu item photo already in storage to a genuine
 * 1200x1200 square, in place (same storage path, same public URL, no
 * menu_items.image_url update needed).
 *
 * One universal square for every item, not a per-category shape: tried
 * per-category aspect ratios and it made cards different sizes
 * depending which category they were in, inconsistent rather than
 * considered. Every card is the same size.
 *
 * Two passes get applied within that one square. First, a custom
 * content-box detection (not sharp's built-in trim, which requires
 * every single pixel in a row to match the background and fails the
 * moment there's a stray compression artefact or a thin sliver of
 * product) finds and removes excess flat backdrop, generously padded
 * (15% top, 8% bottom/sides) since irregular product edges (turkey
 * curls, a whipped-cream peak) need real headroom, not a tight box.
 * This is what fixes photos where the product sat as a thin strip in
 * a mostly-empty square (several Savory sandwiches lost 40%+ of their
 * frame height to flat pink backdrop above and below). Then sharp's
 * attention strategy (libvips saliency detection, not a fixed anchor
 * point) crops that trimmed region into the final square, so a photo
 * that still doesn't match 1:1 after trimming still gets a
 * content-aware crop rather than a blind centred one.
 *
 * Run again if new items get added with source photos this hasn't seen.
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
  type Row = (typeof items)[number];
  const byUrl = new Map<string, Row[]>();
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

      const cropped = await smartCrop(original);

      for (let i = 0; i < refs.length; i++) {
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
