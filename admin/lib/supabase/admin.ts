import { createClient } from "@supabase/supabase-js";

/**
 * service_role client. Bypasses RLS entirely, writes freely. Only ever
 * call this from a "use server" action or a plain (non-"use client")
 * Server Component under app/admin: Next's RSC boundary keeps any
 * module only reachable from server code out of the client bundle,
 * same guarantee lib/supabase/server.ts's anon client already relies
 * on, so this needs the same discipline, not a different one. Never
 * import this from a file with a "use client" directive, and never let
 * a value read through this client reach a client component without
 * going through a page that's meant to show it (see app/admin/layout.tsx
 * for the auth gate this all sits behind, once that's wired up).
 *
 * SUPABASE_SERVICE_ROLE_KEY is intentionally not set as a Vercel
 * environment variable (see CLAUDE.md, Security). That's not a gap to
 * fix, it's what keeps /admin from being a live write path on the
 * deployed site before real auth exists: this throws immediately if
 * the key is missing, so app/admin only actually functions where
 * .env.local provides it (local dev), not in production.
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
