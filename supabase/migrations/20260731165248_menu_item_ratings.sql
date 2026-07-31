-- Real, owner-entered aggregate ratings on menu_items (rating_average,
-- rating_count), for the redesigned menu card's star row. Not a
-- customer review-submission system: this project has no accounts or
-- auth at all, and RLS is strict "anonymous select and nothing else"
-- (see CLAUDE.md Security), so a public write path for reviews would
-- need its own auth/abuse-prevention design this migration does not
-- attempt. The owner sets these two numbers through the dashboard,
-- same as every other field on this table, pulled from wherever their
-- real reviews already live (Google, Facebook, etc.), not fabricated
-- by the app. Both default to "no rating yet" (null average, zero
-- count) rather than a fake starting value, and the front end must
-- only render the star row when rating_count > 0.

alter table public.menu_items
  add column rating_average numeric(2, 1),
  add column rating_count int not null default 0;

alter table public.menu_items
  add constraint menu_items_rating_average_range
  check (rating_average is null or (rating_average >= 0 and rating_average <= 5));

alter table public.menu_items
  add constraint menu_items_rating_count_non_negative
  check (rating_count >= 0);

-- No RLS change: menu_items already has "menu items are publicly
-- readable" (unfiltered select, see 20260727201637_fix_availability_rls.sql),
-- these are just two more columns on the same row, covered by the
-- existing policy automatically.
