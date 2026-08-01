import { redirect } from "next/navigation";

// Products is the only section built so far (see CLAUDE.md, Admin
// dashboard). Once stats/orders exist this becomes a real landing page
// instead of a redirect.
export default function AdminIndex() {
  redirect("/admin/products");
}
