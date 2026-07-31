-- Item add-ons: optional, per-item extras with their own surcharge
-- ("Extra Sauce", "Extra Flavor", "Extra Boba Topping" on the old site,
-- e.g. Ice White Mocha's Dark Chocolate / White Chocolate / Caramel /
-- De Lecce sauce options at +30 EGP each). Not the custom-build draft
-- sitting in 20260728164633_custom_build_schema.sql, that's a
-- different, still-unsigned-off feature (build a cone from scratch,
-- every step required) for the empty "Custom Cone/Classic Build"
-- categories. This is the opposite shape: an existing catalog item
-- (flat-price or sized, already in menu_items) optionally gets extras
-- bolted on. Genuinely different data, so its own tables rather than
-- reusing custom_build_steps/options.
--
-- Table and RLS in one migration, same reasoning as
-- 20260727194235_menu_schema.sql: they aren't meaningful apart, and
-- splitting them is how RLS gets forgotten on a later migration.
--
-- Shape: an item has zero or more addon groups ("Extra Sauce"), each
-- group has one or more options ("Dark Chocolate", +30 EGP). Every
-- group on the old site is optional and lets more than one option be
-- picked (two different sauces on one drink), hence is_required
-- defaults false and allows_multiple defaults true, but both are
-- per-group flags, not hardcoded, in case a future group needs
-- required or single-select behaviour. No is_required/allows_multiple
-- override needed at the option level, only groups make that call.

create table public.item_addon_groups (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid not null references public.menu_items (id) on delete cascade,
  name_en         text not null,
  name_ar         text,
  is_required     boolean not null default false,
  allows_multiple boolean not null default true,
  sort_order      int not null default 0
);

create table public.item_addon_options (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.item_addon_groups (id) on delete cascade,
  name_en      text not null,
  name_ar      text,
  price_delta  numeric(10, 2) not null default 0,
  is_available boolean not null default true,
  sort_order   int not null default 0
);

create index item_addon_groups_item_id_idx on public.item_addon_groups (item_id);
create index item_addon_options_group_id_idx on public.item_addon_options (group_id);


-- ---------------------------------------------------------------------
-- Row Level Security: same pattern as every other table in this
-- project. Anonymous select, unfiltered at the DB level. An
-- unavailable option (86'd sauce) still needs to reach the front end
-- so it can render dimmed and disabled, not vanish, the same "dim,
-- don't hide" rule as menu_items.is_available. No insert, update, or
-- delete policy anywhere: writes happen through the dashboard under
-- the owner's own login, which bypasses RLS entirely.
-- ---------------------------------------------------------------------

alter table public.item_addon_groups enable row level security;
alter table public.item_addon_options enable row level security;

create policy "item addon groups are publicly readable"
  on public.item_addon_groups
  for select
  to anon
  using (true);

create policy "item addon options are publicly readable"
  on public.item_addon_options
  for select
  to anon
  using (true);
