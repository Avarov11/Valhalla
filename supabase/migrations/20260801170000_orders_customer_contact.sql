-- Checkout gained a real name/phone step (2026-08-01, direct follow-up:
-- the flow needed to be select items -> cart -> checkout with an order
-- summary -> WhatsApp, not straight from cart to WhatsApp, and every
-- order needed a name and phone number captured explicitly).
--
-- Nullable, not NOT NULL: a real order already exists in this table
-- (placed live before this migration, via the original two-step
-- flow that had no name/phone fields at all) and it honestly has
-- neither. Backfilling it with an invented name or a copy of some
-- other field would be exactly the kind of fabricated business data
-- this project refuses to do anywhere else (see CLAUDE.md, Content).
-- "Required" is enforced one layer up instead: lib/orders/create-order.ts
-- rejects an empty name or phone before ever reaching this table, so
-- every order from this point forward will have both, without the
-- database lying about the one row that predates the field.

alter table public.orders
  add column customer_name text,
  add column customer_phone text;
