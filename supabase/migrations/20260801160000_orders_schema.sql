-- Orders: a real record of "Order on WhatsApp" taps. Previously
-- deferred by explicit agreement (see CLAUDE.md, Admin dashboard,
-- Orders page: "we will make order schema later"), built now on a
-- direct follow-up request. The public checkout flow itself doesn't
-- change: a customer's order is still placed by sending a WhatsApp
-- message (lib/cart/whatsapp.ts), nothing here gates or blocks that.
-- This table is a courtesy record for the owner to look back at, built
-- alongside that message, not instead of it.
--
-- This is the first table in this project that an anonymous customer's
-- browser can ever cause a write to. Deliberately NOT done with a new
-- anon insert RLS policy: every write instead goes through exactly one
-- Next.js server action on the customer site (lib/orders/create-order.ts),
-- using a service-role client the same way admin/'s own mutations do.
-- The browser never gets a Supabase client capable of writing here, it
-- can only invoke that one server action, which re-resolves the cart
-- against live menu data itself (reusing resolveCartLines/
-- buildWhatsAppOrder, the exact same functions the client used to
-- build the WhatsApp message) rather than trusting whatever prices or
-- names the client sends. This is why RLS below has zero policies for
-- anon, not even select: nobody outside a service-role client should
-- ever read or write a row here directly.
--
-- items is a snapshot, not a live reference: unlike the cart (which
-- must always resolve current prices because stale localStorage could
-- be weeks old, see cart/types.ts), an order row is a historical
-- record of what was actually quoted at that moment. If the owner
-- raises a price tomorrow, today's order should still show today's
-- price, not silently update. status has no automation yet, an owner
-- action from the admin project moves it forward manually.

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  status           text not null default 'new' check (status in ('new', 'confirmed', 'completed', 'cancelled')),
  items            jsonb not null,
  total_price      numeric(10, 2) not null check (total_price >= 0),
  whatsapp_message text not null
);

create index orders_created_at_idx on public.orders (created_at desc);

-- ---------------------------------------------------------------------
-- Row Level Security: unlike every other table in this project, anon
-- gets nothing here, not even select. Every access, read or write,
-- goes through a service_role client (the customer site's
-- create-order server action to write, admin/ to read), which bypasses
-- RLS entirely. RLS is still enabled (not just "no anon policy") so a
-- future migration can't accidentally leave this open by adding a
-- broad policy without a second thought.
-- ---------------------------------------------------------------------

alter table public.orders enable row level security;
