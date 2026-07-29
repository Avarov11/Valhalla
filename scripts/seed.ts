import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import path from "node:path";
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
  categories: MenuCategory[];
};

const FORCE = process.argv.includes("--force");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const menuPath = path.join(process.cwd(), "menu.json");
  const menu: MenuJson = JSON.parse(readFileSync(menuPath, "utf8"));

  if (FORCE) {
    console.log("--force: wiping categories (cascades to menu_items and item_sizes)...");
    const { error } = await supabase
      .from("categories")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;
  }

  const stats = {
    categoriesCreated: 0,
    categoriesExisting: 0,
    itemsCreated: 0,
    itemsExisting: 0,
  };

  for (const [categoryIndex, category] of menu.categories.entries()) {
    const { data: existingCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category.slug)
      .maybeSingle();

    const { data: categoryId, error: categoryError } = await supabase.rpc(
      "admin_upsert_category",
      {
        p_slug: category.slug,
        p_name_en: category.en,
        p_name_ar: category.ar,
        p_blurb: category.blurb ?? null,
        p_sort_order: categoryIndex,
      },
    );

    if (categoryError) {
      throw new Error(`Category "${category.slug}" failed: ${categoryError.message}`);
    }

    if (existingCategory) {
      stats.categoriesExisting += 1;
    } else {
      stats.categoriesCreated += 1;
    }

    for (const [itemIndex, item] of category.items.entries()) {
      const { data: existingItem } = await supabase
        .from("menu_items")
        .select("id")
        .eq("category_id", categoryId)
        .eq("name_en", item.en)
        .maybeSingle();

      const hasSizes = item.sizes !== undefined;
      const price = hasSizes ? null : (item.price ?? null);
      const sizes = hasSizes
        ? Object.entries(item.sizes!).map(([label, sizePrice]) => ({
            label,
            price: sizePrice,
          }))
        : null;

      const { error: itemError } = await supabase.rpc("admin_upsert_menu_item", {
        p_category_id: categoryId,
        p_name_en: item.en,
        p_name_ar: null,
        p_description: item.desc ?? null,
        p_price: price,
        p_is_popular: item.popular ?? false,
        p_sort_order: itemIndex,
        p_sizes: sizes,
      });

      if (itemError) {
        throw new Error(
          `Item "${category.slug}/${item.en}" failed: ${itemError.message}`,
        );
      }

      if (existingItem) {
        stats.itemsExisting += 1;
      } else {
        stats.itemsCreated += 1;
      }
    }
  }

  const { count: finalCategoryCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true });
  const { count: finalItemCount } = await supabase
    .from("menu_items")
    .select("*", { count: "exact", head: true });
  const { count: finalSizeCount } = await supabase
    .from("item_sizes")
    .select("*", { count: "exact", head: true });

  console.log("");
  console.log(
    `categories: ${stats.categoriesCreated} created, ${stats.categoriesExisting} already existed (untouched)`,
  );
  console.log(
    `items: ${stats.itemsCreated} created, ${stats.itemsExisting} already existed (untouched)`,
  );
  console.log("");
  console.log(`categories in database: ${finalCategoryCount} (menu.json has ${menu.categories.length})`);
  console.log(
    `menu_items in database: ${finalItemCount} (menu.json has ${menu.categories.reduce((n, c) => n + c.items.length, 0)})`,
  );
  console.log(`item_sizes in database: ${finalSizeCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
