import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * On-demand cache invalidation, called by the standalone admin project
 * (admin/app/admin/products/actions.ts) after every write. admin/ and
 * this project are separate Vercel deployments now (see CLAUDE.md,
 * Admin dashboard), so admin's own revalidatePath calls only ever
 * touched admin's cache, never this one. Without this route, an
 * owner's price/photo/availability edit still reached this site, just
 * up to 60s later via this project's own ISR window (see
 * app/(customer)/page.tsx's revalidate export), not never. This closes
 * that gap: the DB write already happened by the time this fires, this
 * only controls how fast it becomes visible, not whether it's correct.
 *
 * Auth is a single shared secret (REVALIDATE_SECRET), not RLS or a
 * session: this route does no reads or writes of its own, it only asks
 * Next to drop cache entries, so the worst an attacker who guessed the
 * secret could do is force extra Supabase reads, not touch data. Same
 * env var name and value on both projects.
 *
 * Best-effort by design on the caller's side (see actions.ts): if this
 * project is unreachable or slow, the admin write still succeeded
 * against the database, and the 60s ISR window is the fallback, so
 * this endpoint failing is never the difference between "saved" and
 * "not saved," only between "instant" and "within a minute."
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_SECRET;

  if (!expected || !secret || secret !== expected) {
    return NextResponse.json({ revalidated: false, error: "Invalid secret" }, { status: 401 });
  }

  revalidatePath("/");
  revalidatePath("/item/[id]", "page");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
