-- CLAUDE.md corrects the original RLS design: menu_items and item_sizes
-- must NOT be gated on is_available. An unavailable item still has to
-- reach the front end so it can render dimmed with its add control
-- disabled; if RLS hides it entirely, the front end never learns it
-- exists to render it that way. Only categories stay gated, on
-- is_active. This replaces the select policies from
-- 20260727194235_menu_schema.sql (never editing an applied migration,
-- fixing forward instead).

drop policy "menu items are publicly readable when available" on public.menu_items;
drop policy "item sizes are publicly readable when their item is available" on public.item_sizes;

create policy "menu items are publicly readable"
  on public.menu_items
  for select
  to anon
  using (true);

create policy "item sizes are publicly readable"
  on public.item_sizes
  for select
  to anon
  using (true);
