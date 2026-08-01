import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

type MenuItem = {
  en: string;
  desc: string;
  price?: number;
  sizes?: Record<string, number>;
  popular?: boolean;
  imagePath: string;
};

type MenuCategory = {
  slug: string;
  en: string;
  ar: string;
  blurb: string;
  items: MenuItem[];
};

type MenuJson = {
  brand: { imageHost: string };
  categories: MenuCategory[];
};

const MAX_WIDTH = 1600;
const WEBP_QUALITY = 82;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSourceUrl(imageHost: string, imagePath: string): string {
  const encodedSegments = imagePath.split("/").map((segment) => encodeURIComponent(segment));
  return imageHost.replace(/\/$/, "") + encodedSegments.join("/");
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const menuPath = path.join(process.cwd(), "menu.json");
  const menu: MenuJson = JSON.parse(readFileSync(menuPath, "utf8"));

  // Assign each item a unique per-category slug up front (guards against
  // two items in the same category slugifying to the same string).
  type Ref = { categorySlug: string; itemSlug: string; nameEn: string; imagePath: string };
  const refs: Ref[] = [];
  const pathToRefs = new Map<string, Ref[]>();

  for (const category of menu.categories) {
    const usedSlugs = new Set<string>();
    for (const item of category.items) {
      let itemSlug = slugify(item.en);
      while (usedSlugs.has(itemSlug)) {
        itemSlug = `${itemSlug}-2`;
      }
      usedSlugs.add(itemSlug);

      const ref: Ref = {
        categorySlug: category.slug,
        itemSlug,
        nameEn: item.en,
        imagePath: item.imagePath,
      };
      refs.push(ref);

      const existing = pathToRefs.get(item.imagePath) ?? [];
      existing.push(ref);
      pathToRefs.set(item.imagePath, existing);
    }
  }

  console.log(`${refs.length} items reference ${pathToRefs.size} unique source images.`);

  let downloaded = 0;
  let uploaded = 0;
  let updated = 0;
  const failures: { imagePath: string; error: string }[] = [];

  for (const [imagePath, itemRefs] of pathToRefs) {
    const sourceUrl = buildSourceUrl(menu.brand.imageHost, imagePath);

    let webpBuffer: Buffer;
    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const original = Buffer.from(await response.arrayBuffer());
      webpBuffer = await sharp(original)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
      downloaded += 1;
    } catch (err) {
      failures.push({ imagePath, error: (err as Error).message });
      continue;
    }

    for (const ref of itemRefs) {
      const storagePath = `${ref.itemSlug}.webp`;

      const { error: uploadError } = await supabase.storage
        .from(ref.categorySlug)
        .upload(storagePath, webpBuffer, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) {
        failures.push({ imagePath: `${ref.categorySlug}/${storagePath}`, error: uploadError.message });
        continue;
      }
      uploaded += 1;

      const { data: publicUrlData } = supabase.storage.from(ref.categorySlug).getPublicUrl(storagePath);

      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", ref.categorySlug)
        .single();

      if (!category) {
        failures.push({ imagePath, error: `category not found: ${ref.categorySlug}` });
        continue;
      }

      const { error: updateError, count } = await supabase
        .from("menu_items")
        .update({ image_url: publicUrlData.publicUrl }, { count: "exact" })
        .eq("category_id", category.id)
        .eq("name_en", ref.nameEn);

      if (updateError) {
        failures.push({ imagePath, error: updateError.message });
        continue;
      }
      if (!count) {
        failures.push({
          imagePath,
          error: `no menu_items row matched ${ref.categorySlug}/${ref.nameEn}, run npm run seed first`,
        });
        continue;
      }
      updated += 1;
    }
  }

  console.log("");
  console.log(`downloaded + converted: ${downloaded} / ${pathToRefs.size} unique images`);
  console.log(`uploaded: ${uploaded} / ${refs.length} item photos`);
  console.log(`menu_items.image_url updated: ${updated} / ${refs.length}`);

  if (failures.length > 0) {
    console.log("");
    console.log(`${failures.length} failure(s):`);
    for (const failure of failures) {
      console.log(`  ${failure.imagePath}: ${failure.error}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
