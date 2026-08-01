import { createClient } from "@supabase/supabase-js";

/**
 * service_role client. Bypasses RLS entirely. Only ever call this from
 * a "use server" file, never a client component: Next's RSC boundary
 * keeps server-only modules out of the client bundle, the same
 * guarantee lib/supabase/server.ts's anon client already relies on.
 *
 * This project deliberately had no service-role key in its Vercel
 * environment for most of its life (see CLAUDE.md, Security and Admin
 * dashboard): the whole customer-facing site was read-only against
 * Supabase, so there was nothing for the key to do. That changed
 * 2026-08-01 when order recording was built (lib/orders/create-order.ts):
 * that's the first anonymous write path this project has ever had. The
 * key is scoped as tightly as the admin project's own copy of this
 * file: it's reachable from exactly one server action, which only ever
 * inserts a row into orders, built from data the action resolves
 * itself against the live catalog, never from whatever the client
 * sends. The browser never receives this key or a client capable of
 * using it.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
