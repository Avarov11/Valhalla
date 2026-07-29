import { createClient } from "@supabase/supabase-js";

/**
 * Anon/publishable client for server components. Reads only, gated entirely
 * by the RLS policies in supabase/migrations (is_active / is_available).
 * Never import this alongside a service-role key.
 */
export function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
