-- One storage bucket per category, not one shared `menu-images` bucket
-- with a category-slug path prefix (2026-08-01, direct request). All
-- 134 existing menu_items.image_url values were already migrated to
-- their new per-category bucket by a one-off script before this
-- migration was written (download from the old menu-images path,
-- upload to <category-slug>/<item-slug>.webp under a bucket named
-- after that category, update image_url), verified live (every new
-- URL fetched 200, none still pointed at menu-images) before this file
-- was added. This migration exists to make the bucket creation itself
-- reproducible from migrations, matching how the original menu-images
-- bucket was created in 20260727194235_menu_schema.sql, rather than
-- leaving it as something that only happened once via an ad-hoc script
-- and was never recorded as schema.
--
-- Bucket id/name is the category's own slug, so a bucket always exists
-- for every category without hardcoding a list of 15 specific strings
-- here, the same "never hardcode what the owner could change" reasoning
-- CLAUDE.md applies to application code, applied to this migration too.
--
-- Public flag only, no storage.objects select policy: the earlier
-- fix-advisor-findings migration (20260727194610) already established
-- why for the original bucket, the same reasoning applies to all of
-- these. A public bucket serves direct object-URL reads (what
-- next/image uses) without any RLS policy at all; a select policy
-- would only add an unneeded bucket-listing capability. Do not add one
-- back for any of these buckets, per CLAUDE.md, Security.
--
-- The old menu-images bucket and its objects are deliberately left in
-- place, not dropped here: nothing currently reads from it (every
-- image_url now points at a per-category bucket instead), but keeping
-- it costs nothing and leaves an easy rollback path if the migration
-- above needs to be re-verified. Dropping it is a separate, explicit
-- decision for later, not bundled into this one.

insert into storage.buckets (id, name, public)
select slug, slug, true
from public.categories
on conflict (id) do nothing;
