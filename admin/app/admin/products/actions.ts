"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_WIDTH = 1600;
const WEBP_QUALITY = 82;

type ActionResult = { ok: true } | { ok: false; error: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function revalidate() {
  // Both, not just products: now that both pages carry a short ISR
  // window (see products/page.tsx, stats/page.tsx) instead of
  // force-dynamic, Stats' aggregate counts read from the same
  // underlying data and need the same immediate invalidation on write,
  // not just Products' own list.
  revalidatePath("/admin/products");
  revalidatePath("/admin/stats");
  await revalidateCustomerSite();
}

/**
 * admin/ and the customer-facing site are separate Vercel deployments
 * (see CLAUDE.md, Admin dashboard), so the revalidatePath calls above
 * only ever clear THIS project's own cache. Without this, an owner's
 * edit here would still reach the customer site, just up to 60s later
 * via its own ISR window (app/(customer)/page.tsx's revalidate = 60 in
 * the main project), not never: CLAUDE.md's actual hard requirement
 * (never charge a stale PRICE at order time) is already met by the DB
 * write itself finishing before this even runs. This purely controls
 * how fast a name/price/photo/availability change becomes visible to a
 * customer looking at the menu right now.
 *
 * Best-effort on purpose: if the customer site is slow or unreachable,
 * the mutation already succeeded against the database, and the 60s ISR
 * window is the fallback, so a failure here is swallowed rather than
 * surfaced as an admin-facing error. A 4s timeout keeps a slow customer
 * deployment from making every admin save feel slow.
 */
async function revalidateCustomerSite() {
  const baseUrl = process.env.CUSTOMER_SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!baseUrl || !secret) return;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    await fetch(`${baseUrl}/api/revalidate`, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch {
    // See comment above: swallowed by design.
  }
}

/**
 * Everything below goes through the service_role client
 * (lib/supabase/admin.ts). No RLS policy anywhere grants anon write
 * access, on purpose, see CLAUDE.md: writes only ever happen server-
 * side, with the key that stays out of the client bundle entirely.
 */

export async function updateItemFields(
  itemId: string,
  fields: {
    name_en: string;
    name_ar: string | null;
    description: string | null;
    price: number | null;
    sizePrices: { id: string; price: number }[] | null;
  },
): Promise<ActionResult> {
  const name_en = fields.name_en.trim();
  if (!name_en) {
    return { ok: false, error: "Name can't be empty." };
  }

  const supabase = createAdminClient();

  const { error: itemError } = await supabase
    .from("menu_items")
    .update({
      name_en,
      name_ar: fields.name_ar?.trim() || null,
      description: fields.description?.trim() || null,
      ...(fields.price !== null ? { price: fields.price } : {}),
    })
    .eq("id", itemId);

  if (itemError) {
    return { ok: false, error: itemError.message };
  }

  if (fields.sizePrices) {
    const { error: sizesError } = await supabase
      .from("item_sizes")
      .upsert(fields.sizePrices, { onConflict: "id" });

    if (sizesError) {
      return { ok: false, error: sizesError.message };
    }
  }

  await revalidate();
  return { ok: true };
}

export async function setAvailability(itemId: string, isAvailable: boolean): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: isAvailable })
    .eq("id", itemId);

  if (error) return { ok: false, error: error.message };
  await revalidate();
  return { ok: true };
}

export async function setPopular(itemId: string, isPopular: boolean): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ is_popular: isPopular })
    .eq("id", itemId);

  if (error) return { ok: false, error: error.message };
  await revalidate();
  return { ok: true };
}

export async function deleteItem(itemId: string): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", itemId);

  if (error) return { ok: false, error: error.message };
  await revalidate();
  return { ok: true };
}

/**
 * Flat price only. A new sized item would need its item_sizes rows
 * created in the same transaction as the menu_items row (the
 * price-or-sizes constraint trigger is deferred to commit, not per
 * statement, see supabase/migrations/20260727194235_menu_schema.sql),
 * which a plain supabase-js insert can't do since each call is its own
 * transaction. admin_upsert_menu_item (from the seed pipeline) already
 * solves this with a PL/pgSQL function, but it's upsert-shaped for
 * idempotent seeding, not create semantics, a duplicate name would
 * silently return the existing item instead of erroring. Out of scope
 * this session; sized-item creation needs its own real form (a size
 * label/price repeater), not a corner case bolted onto this one.
 */
export async function createItem(fields: {
  category_id: string;
  name_en: string;
  name_ar: string | null;
  description: string | null;
  price: number;
  is_popular: boolean;
}): Promise<ActionResult> {
  const name_en = fields.name_en.trim();
  if (!name_en) {
    return { ok: false, error: "Name can't be empty." };
  }
  if (!Number.isFinite(fields.price) || fields.price < 0) {
    return { ok: false, error: "Price must be a non-negative number." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("menu_items").insert({
    category_id: fields.category_id,
    name_en,
    name_ar: fields.name_ar?.trim() || null,
    description: fields.description?.trim() || null,
    price: fields.price,
    is_popular: fields.is_popular,
    is_available: true,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "An item with this name already exists in this category." };
    }
    return { ok: false, error: error.message };
  }

  await revalidate();
  return { ok: true };
}

/**
 * Runs the exact same resize + WebP conversion as scripts/upload-images.ts
 * (1600px max width, quality 82), so an owner-uploaded photo never lands
 * in storage as a raw multi-megabyte PNG regardless of what they picked
 * on their end.
 *
 * One bucket per category, not one shared bucket with a category-slug
 * path prefix (2026-08-01, direct request, all 134 existing images
 * already migrated). The bucket is always the item's current category
 * slug and the path is always its own item slug, computed fresh on
 * every replace rather than parsed back out of the existing image_url:
 * items can't be recategorized through this admin yet (updateItemFields
 * never touches category_id), so "current category" and "the category
 * this photo already lives under" are always the same thing, and
 * computing fresh is simpler than round-tripping through the URL.
 * Still an upsert to the same path, so image_url itself never changes
 * on a replace, matching "every item owns its own storage object."
 */
export async function replacePhoto(itemId: string, formData: FormData): Promise<ActionResult> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file provided." };
  }

  const supabase = createAdminClient();

  const { data: item, error: fetchError } = await supabase
    .from("menu_items")
    .select("id, name_en, categories(slug)")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) {
    return { ok: false, error: fetchError?.message ?? "Item not found." };
  }

  const categorySlug = (item.categories as unknown as { slug: string } | null)?.slug;
  if (!categorySlug) {
    return { ok: false, error: "Item has no category, can't determine which bucket to store its photo in." };
  }
  const storagePath = `${slugify(item.name_en)}.webp`;

  let webpBuffer: Buffer;
  try {
    const original = Buffer.from(await file.arrayBuffer());
    webpBuffer = await sharp(original)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch {
    return { ok: false, error: "Could not process that image file." };
  }

  const { error: uploadError } = await supabase.storage
    .from(categorySlug)
    .upload(storagePath, webpBuffer, { contentType: "image/webp", upsert: true });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage.from(categorySlug).getPublicUrl(storagePath);

  const { error: updateError } = await supabase
    .from("menu_items")
    .update({ image_url: publicUrlData.publicUrl })
    .eq("id", itemId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await revalidate();
  return { ok: true };
}
