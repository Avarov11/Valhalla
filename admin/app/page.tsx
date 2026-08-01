import { redirect } from "next/navigation";

// This project's own root has nothing at it, everything lives under
// /admin/* (kept nested exactly as it was inside the main project when
// this got split out, see CLAUDE.md, Admin dashboard, to minimize risk
// during the move). Redirect straight there instead of a 404 on the
// bare domain.
export default function RootIndex() {
  redirect("/admin/products");
}
