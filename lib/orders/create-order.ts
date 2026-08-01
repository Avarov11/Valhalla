"use server";

import { getMenu } from "@/lib/menu/get-menu";
import { resolveCartLines } from "@/lib/cart/resolve";
import { buildWhatsAppOrder } from "@/lib/cart/whatsapp";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CartLine } from "@/lib/cart/types";

type CreateOrderResult = { ok: true } | { ok: false; error: string };

/**
 * Records an order alongside the WhatsApp message the customer is
 * about to send (see components/cart/CartDrawer.tsx's checkout step),
 * it does not gate or replace that flow: if this fails, the WhatsApp
 * link still opens, the customer's actual order still goes through,
 * this is only the owner's bookkeeping copy.
 *
 * Takes raw CartLine[] (item/size/addon ids and quantities only), the
 * same shape localStorage holds, never the client's already-resolved
 * names or prices. Re-resolves against a fresh getMenu() read here,
 * server-side, at the moment of the click, reusing the exact same
 * resolveCartLines/buildWhatsAppOrder functions the client used to
 * build the on-screen cart and the WhatsApp message text, so the
 * stored record matches what the customer actually saw, computed from
 * a live read rather than trusted from the browser. This is the same
 * "never trust a stored price" discipline the cart itself already
 * applies to localStorage, applied a second time here so a manipulated
 * client request can't write a fabricated cheap order into the record.
 *
 * customer_name/customer_phone are nullable at the DB level (a real
 * order was placed before checkout collected them at all, see
 * supabase/migrations/20260801170000_orders_customer_contact.sql) but
 * required here: the checkout form already requires non-empty values
 * before its button enables, this re-validates server-side too rather
 * than trusting that client-side check alone.
 */
export async function createOrder(
  lines: CartLine[],
  customerName: string,
  customerPhone: string,
): Promise<CreateOrderResult> {
  const name = customerName.trim();
  const phone = customerPhone.trim();

  if (lines.length === 0) {
    return { ok: false, error: "Cart is empty." };
  }
  if (!name) {
    return { ok: false, error: "Name is required." };
  }
  if (!phone) {
    return { ok: false, error: "Phone number is required." };
  }

  const menu = await getMenu();
  const { resolved } = resolveCartLines(lines, menu);

  if (resolved.length === 0) {
    return { ok: false, error: "None of these items could be resolved against the current menu." };
  }

  const { message } = buildWhatsAppOrder(resolved, name, phone);
  const totalPrice = resolved.reduce((sum, line) => sum + line.lineTotal, 0);

  const items = resolved.map((line) => ({
    item_id: line.itemId,
    name: line.name,
    size_label: line.sizeLabel,
    addons: line.addons.map((a) => ({ name: a.name, price_delta: a.priceDelta })),
    quantity: line.quantity,
    unit_price: line.unitPrice,
    line_total: line.lineTotal,
  }));

  const supabase = createAdminClient();
  const { error } = await supabase.from("orders").insert({
    items,
    total_price: totalPrice,
    whatsapp_message: message,
    customer_name: name,
    customer_phone: phone,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
