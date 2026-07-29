-- Valhalla menu schema: categories, menu_items, item_sizes, the
-- price-or-sizes invariant, RLS, and the menu-images storage bucket.
--
-- Everything for this feature lives in one migration on purpose: the
-- tables, the constraint, and the RLS policies are not meaningful in
-- isolation from each other, and splitting them across files is how RLS
-- gets forgotten on a later migration.

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name_en     text not null,
  name_ar     text not null,
  blurb       text,
  sort_order  int not null default 0,
  is_active   boolean not null default true
);

create table public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.categories (id) on delete cascade,
  name_en       text not null,
  name_ar       text,
  description   text,
  price         numeric(10, 2),
  is_popular    boolean not null default false,
  is_available  boolean not null default true,
  image_url     text,
  sort_order    int not null default 0
);

create table public.item_sizes (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.menu_items (id) on delete cascade,
  label       text not null,
  price       numeric(10, 2) not null,
  sort_order  int not null default 0
);

create index menu_items_category_id_idx on public.menu_items (category_id);
create index item_sizes_item_id_idx on public.item_sizes (item_id);

-- Backs the seed script's upsert-on-(category_slug, name_en) requirement
-- and doubles as the uniqueness guarantee that makes the upsert safe.
create unique index menu_items_category_id_name_en_key
  on public.menu_items (category_id, name_en);


-- ---------------------------------------------------------------------
-- Price-or-sizes constraint
--
-- A menu_item has a flat `price` XOR at least one `item_sizes` row,
-- never both, never neither. This cannot be a plain CHECK on menu_items
-- because the rule depends on rows existing in a different table, and
-- Postgres CHECK constraints can only see the row being written.
--
-- Enforced with a pair of DEFERRABLE INITIALLY DEFERRED constraint
-- triggers, so the check runs at COMMIT rather than after each
-- individual statement. That matters because creating a sized item is
-- naturally two statements in one transaction (insert the menu_item
-- with price = null, then insert its item_sizes rows); an immediate
-- trigger would reject the first statement before the second ever runs.
-- A single-statement edit (e.g. via the dashboard table editor) still
-- gets checked right away, since its implicit transaction ends when the
-- statement does. Converting an item's price/sizes shape after the fact
-- through the table editor needs both statements wrapped in one
-- transaction (the SQL editor, not a lone cell edit) for the same
-- reason.
-- ---------------------------------------------------------------------

create function public.check_menu_item_price_xor_sizes(p_item_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  has_price boolean;
  has_sizes boolean;
begin
  select (price is not null) into has_price
  from public.menu_items
  where id = p_item_id;

  if not found then
    -- item itself was deleted earlier in this transaction
    return;
  end if;

  select exists (
    select 1 from public.item_sizes where item_id = p_item_id
  ) into has_sizes;

  if has_price and has_sizes then
    raise exception 'menu_items.% has both a price and item_sizes rows, must be exactly one', p_item_id;
  end if;

  if not has_price and not has_sizes then
    raise exception 'menu_items.% has neither a price nor item_sizes rows, must be exactly one', p_item_id;
  end if;
end;
$$;

create function public.trg_check_menu_item_price()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform public.check_menu_item_price_xor_sizes(new.id);
  return null;
end;
$$;

create constraint trigger menu_items_price_xor_sizes
  after insert or update of price on public.menu_items
  deferrable initially deferred
  for each row
  execute function public.trg_check_menu_item_price();

create function public.trg_check_item_sizes_price()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_item_id uuid;
begin
  v_item_id := coalesce(new.item_id, old.item_id);
  perform public.check_menu_item_price_xor_sizes(v_item_id);
  return null;
end;
$$;

create constraint trigger item_sizes_price_xor_sizes
  after insert or update or delete on public.item_sizes
  deferrable initially deferred
  for each row
  execute function public.trg_check_item_sizes_price();


-- ---------------------------------------------------------------------
-- Row Level Security
--
-- Enabled on all three tables first, policies written after. Exactly
-- one policy per table: anonymous select, gated on is_active for
-- categories and is_available for items (item_sizes has no flag of its
-- own, so it's gated on its parent menu_item's is_available). No insert,
-- update, or delete policy anywhere, for any role: with RLS on and no
-- write policy, every write is denied by default. Writes happen through
-- the dashboard with the owner's own login, which connects directly to
-- Postgres and bypasses RLS entirely, so it needs no policy here.
-- ---------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.item_sizes enable row level security;

create policy "categories are publicly readable when active"
  on public.categories
  for select
  to anon
  using (is_active = true);

create policy "menu items are publicly readable when available"
  on public.menu_items
  for select
  to anon
  using (is_available = true);

create policy "item sizes are publicly readable when their item is available"
  on public.item_sizes
  for select
  to anon
  using (
    exists (
      select 1
      from public.menu_items mi
      where mi.id = item_sizes.item_id
        and mi.is_available = true
    )
  );


-- ---------------------------------------------------------------------
-- Storage: menu-images bucket, public read, no anonymous write.
-- Uploads happen from the seed/image-pipeline script (service role key,
-- held locally, never in the client) and afterwards from the dashboard.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

create policy "menu images are publicly readable"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'menu-images');
