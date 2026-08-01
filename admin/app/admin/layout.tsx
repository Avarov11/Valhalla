import { redirect } from "next/navigation";
import { AdminNav } from "./AdminNav";
import { AdminSidebar } from "./AdminSidebar";

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
 *
 * This layout no longer forces the whole subtree dynamic (removed
 * 2026-08-01): it used to, reasoning that Next shouldn't evaluate
 * anything here at build time on a target where
 * SUPABASE_SERVICE_ROLE_KEY is deliberately absent. That reasoning was
 * written when admin was still a route inside the main, publicly
 * deployed project; it doesn't apply to this standalone project, whose
 * only real deployment needs the key present to function at all
 * regardless. A layout-level force-dynamic overrides every child
 * page's own caching config no matter what that page exports (Next's
 * segment config propagates down), which was silently defeating
 * products/page.tsx and stats/page.tsx's own `revalidate = 30` right
 * after they were added, caught by checking `next build`'s own route
 * markers (ƒ vs ●) rather than assuming the page-level export alone
 * was enough. This function itself does no Supabase work, so the
 * layout has nothing that needs forcing dynamic; each page under it
 * now controls its own freshness.
 */
async function isAdminRequestAuthorized(): Promise<boolean> {
  return true;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminRequestAuthorized())) {
    redirect("/");
  }

  return (
    <div className="min-h-dvh bg-(--bg-page) lg:flex">
      <AdminSidebar />

      <div className="flex-1">
        {/* Below lg only: AdminSidebar takes over this role at lg+, its
            own footer note covers "no login yet" there instead. */}
        <header className="flex h-14 items-center justify-between px-4 lg:hidden">
          <span className="font-(family-name:--font-display) text-(length:--text-md) text-(--text-primary)">
            Valhalla Admin
          </span>
          <span className="text-(length:--text-xs) text-(--text-muted)">No login yet, local only</span>
        </header>
        <div className="lg:hidden">
          <AdminNav />
        </div>
        <main className="mx-auto max-w-(--page-max-width) px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
