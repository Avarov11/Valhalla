import { redirect } from "next/navigation";

// Stats, not Products: by explicit request (2026-08-01), the first thing
// the owner sees on opening the dashboard is the overview (today's date,
// greeting, availability, catalog health), not straight into the edit
// list. Once this becomes a real landing page of its own it stops being
// a redirect; for now Stats already IS that overview.
export default function AdminIndex() {
  redirect("/admin/stats");
}
