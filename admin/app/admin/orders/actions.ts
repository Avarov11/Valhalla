"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/lib/admin/order-status";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function setOrderStatus(orderId: string, status: OrderStatus): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);

  if (error) return { ok: false, error: error.message };

  // Both, same reasoning as products/actions.ts: Stats' revenue and
  // order-count numbers read this same table.
  revalidatePath("/admin/orders");
  revalidatePath("/admin/stats");
  return { ok: true };
}
