import { redirect } from "next/navigation";
import { AdminNav } from "./AdminNav";

// Every /admin route is dynamic, always. There's nothing to prerender
// (an authenticated, always-fresh area), and more importantly this
// avoids Next trying to evaluate this layout at build time on Vercel,
// where SUPABASE_SERVICE_ROLE_KEY is deliberately not set (see
// lib/supabase/admin.ts). A build-time evaluation would fail the whole
// site's build over a route nothing public depends on.
export const dynamic = "force-dynamic";

/**
 * The one place auth gets checked for the whole /admin area. Every
 * route under app/admin renders through this layout, and this is the
 * only call to isAdminRequestAuthorized() anywhere, so wiring up real
 * auth later (a Supabase auth session check, a signed cookie, whatever
 * gets decided) is exactly one edit to this one function. Nothing else
 * in app/admin needs to know how auth works, they just render inside a
 * layout that already only mounts once this has passed.
 *
 * TODO(auth, later session): replace the stub body with a real check
 * (e.g. read the Supabase auth session from cookies and verify it
 * belongs to the owner). Until then this always returns true, meaning
 * /admin has no real access control yet, it's protected only by
 * SUPABASE_SERVICE_ROLE_KEY not existing anywhere outside local
 * .env.local, see lib/supabase/admin.ts. Do not deploy this to a
 * target where that env var is set until this stub is replaced.
 */
async function isAdminRequestAuthorized(): Promise<boolean> {
  return true;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminRequestAuthorized())) {
    redirect("/");
  }

  return (
    <div className="min-h-dvh bg-(--bg-page)">
      <header className="flex h-14 items-center justify-between px-4">
        <span className="font-(family-name:--font-display) text-(length:--text-md) text-(--text-primary)">
          Valhalla Admin
        </span>
        <span className="text-(length:--text-xs) text-(--text-muted)">
          No login yet, local only
        </span>
      </header>
      <AdminNav />
      <main className="mx-auto max-w-(--page-max-width) px-4 py-6">{children}</main>
    </div>
  );
}
