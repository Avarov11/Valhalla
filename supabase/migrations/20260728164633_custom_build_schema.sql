-- DRAFT, NOT YET APPLIED. Created for review per the 2026-07-28 design push
-- ("show me the schema change before you build it"). Do not run `db push`
-- until this is signed off.
--
-- Adds the schema for the interactive cone builder ("Custom Cone Build" /
-- "Custom Classic Build", the two categories menu.json lists as empty on
-- the old site). Touches nothing on categories, menu_items, or item_sizes,
-- and does not alter their RLS policies, that work stays exactly as it is.
--
-- Shape: a "build" (Cone or Classic) has an ordered set of "steps"
-- (breading, spread, ice cream, topping), each step has a set of
-- "options" (Nut breading, Oreo breading, ...). A configured cone is one
-- option chosen per required step. This is a genuinely different shape
-- from menu_items/item_sizes (a fixed catalog row with a fixed price),
-- so it gets its own tables rather than being force-fit into the
-- existing ones.

create table public.custom_builds (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,           -- 'cone-build', 'classic-build'
  name_en      text not null,
  name_ar      text not null,
  description  text,
  base_price   numeric(10, 2) not null,        -- price of the plain shell, before any option is chosen
  image_url    text,
  is_available boolean not null default true,  -- unfiltered by RLS, same "dim, don't hide" rule as menu_items
  sort_order   int not null default 0
);

create table public.custom_build_steps (
  id              uuid primary key default gen_random_uuid(),
  build_id        uuid not null references public.custom_builds (id) on delete cascade,
  slug            text not null,               -- 'breading', 'spread', 'ice-cream', 'topping'
  name_en         text not null,
  name_ar         text not null,
  is_required     boolean not null default true,
  allows_multiple boolean not null default false, -- schema supports multi-select toppings later; v1 UI is single-select every step
  sort_order      int not null default 0,
  unique (build_id, slug)
);

create table public.custom_build_options (
  id           uuid primary key default gen_random_uuid(),
  step_id      uuid not null references public.custom_build_steps (id) on delete cascade,
  name_en      text not null,
  name_ar      text,
  price_delta  numeric(10, 2) not null default 0, -- added to base_price (and to every other selected option) when chosen
  image_url    text,                              -- real photo where one exists (breading step), null otherwise, see plan
  is_available boolean not null default true,     -- unfiltered by RLS, dimmed in the picker, not hidden
  sort_order   int not null default 0
);

create index custom_build_steps_build_id_idx on public.custom_build_steps (build_id);
create index custom_build_options_step_id_idx on public.custom_build_options (step_id);


-- ---------------------------------------------------------------------
-- RLS: enabled on all three new tables before any policy, same pattern
-- as every other table in this project. Anonymous select only, nothing
-- filtered at the DB level (an unavailable build/step/option still needs
-- to reach the front end so it can render dimmed instead of vanishing,
-- the same reasoning that already applies to menu_items/item_sizes).
-- This does not touch the existing policies on categories, menu_items,
-- or item_sizes in any way.
-- ---------------------------------------------------------------------

alter table public.custom_builds enable row level security;
alter table public.custom_build_steps enable row level security;
alter table public.custom_build_options enable row level security;

create policy "custom builds are publicly readable"
  on public.custom_builds
  for select
  to anon
  using (true);

create policy "custom build steps are publicly readable"
  on public.custom_build_steps
  for select
  to anon
  using (true);

create policy "custom build options are publicly readable"
  on public.custom_build_options
  for select
  to anon
  using (true);
