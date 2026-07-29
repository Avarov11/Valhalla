-- Helper RPCs for scripts/seed.ts, locked to service_role only.
--
-- Why these exist: the seed script talks to the database over PostgREST
-- (via @supabase/supabase-js with the service role key), not a direct
-- Postgres connection. Every supabase-js call is its own transaction. The
-- price-or-sizes constraint trigger (see 20260727194235_menu_schema.sql)
-- is deferred so a sized item can be created across two statements in
-- ONE transaction, but that only helps if those two statements actually
-- share a transaction. Two separate PostgREST calls (insert the item,
-- then insert its sizes) do not: the first call would commit an item
-- with neither a price nor sizes and get rejected immediately. Wrapping
-- "insert item, then insert its sizes" in a single PL/pgSQL function
-- makes it one call, hence one transaction, hence safe.
--
-- Both functions are upsert-shaped but favor existing data: if a
-- category/item already exists (matched by slug, or by
-- category_id + name_en), they return its id untouched rather than
-- overwriting it, so re-running the seed after the owner has edited a
-- price in the dashboard never clobbers that edit. A full reset is the
-- seed script's job (delete-then-reinsert via --force), not this
-- function's.

create function public.admin_upsert_category(
  p_slug text,
  p_name_en text,
  p_name_ar text,
  p_blurb text,
  p_sort_order int
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.categories where slug = p_slug;
  if v_id is not null then
    return v_id;
  end if;

  insert into public.categories (slug, name_en, name_ar, blurb, sort_order)
  values (p_slug, p_name_en, p_name_ar, p_blurb, p_sort_order)
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.admin_upsert_category(text, text, text, text, int) from public;
grant execute on function public.admin_upsert_category(text, text, text, text, int) to service_role;


create function public.admin_upsert_menu_item(
  p_category_id uuid,
  p_name_en text,
  p_name_ar text,
  p_description text,
  p_price numeric,
  p_is_popular boolean,
  p_sort_order int,
  p_sizes jsonb  -- array of {"label": text, "price": number}, in display order; null when the item is flat-priced
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
  v_size jsonb;
  v_size_index int := 0;
begin
  select id into v_id
  from public.menu_items
  where category_id = p_category_id and name_en = p_name_en;

  if v_id is not null then
    return v_id;
  end if;

  insert into public.menu_items
    (category_id, name_en, name_ar, description, price, is_popular, sort_order)
  values
    (p_category_id, p_name_en, p_name_ar, p_description, p_price, p_is_popular, p_sort_order)
  returning id into v_id;

  if p_sizes is not null then
    for v_size in select * from jsonb_array_elements(p_sizes)
    loop
      insert into public.item_sizes (item_id, label, price, sort_order)
      values (v_id, v_size ->> 'label', (v_size ->> 'price')::numeric, v_size_index);
      v_size_index := v_size_index + 1;
    end loop;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.admin_upsert_menu_item(uuid, text, text, text, numeric, boolean, int, jsonb) from public;
grant execute on function public.admin_upsert_menu_item(uuid, text, text, text, numeric, boolean, int, jsonb) to service_role;
