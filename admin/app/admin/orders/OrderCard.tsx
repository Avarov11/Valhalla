"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";
import type { Order, OrderStatus } from "@/lib/admin/get-admin-orders";
import { formatPrice } from "@/lib/menu/format";
import { setOrderStatus } from "./actions";

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Text tokens throughout, not the status color itself, matching this
// project's "text wears text tokens, never the series color" rule
// (see CLAUDE.md's dataviz-informed Stats page); only the small dot
// and the select's own background carry the status color.
const STATUS_DOT: Record<OrderStatus, string> = {
  new: "var(--admin-stat-blue)",
  confirmed: "var(--admin-stat-orange)",
  completed: "var(--admin-status-good)",
  cancelled: "var(--text-muted)",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showMessage, setShowMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as OrderStatus;
    setError(null);
    startTransition(async () => {
      const result = await setOrderStatus(order.id, status);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-(--radius-lg) border border-(--border-default) bg-(--bg-surface) p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-(--radius-pill)"
            style={{ backgroundColor: STATUS_DOT[order.status] }}
          />
          <span className="text-(length:--text-sm) font-medium text-(--text-primary)">{formatDate(order.created_at)}</span>
        </div>

        <select
          value={order.status}
          onChange={handleStatusChange}
          disabled={isPending}
          className="rounded-(--radius-pill) border border-(--border-default) bg-(--bg-page) px-3 py-1.5 text-(length:--text-xs) font-medium text-(--text-primary) disabled:opacity-60"
        >
          {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="text-(length:--text-xs) text-(--accent-text)">{error}</p> : null}

      {order.customer_name || order.customer_phone ? (
        <p className="text-(length:--text-sm) text-(--text-secondary)">
          <span className="font-medium text-(--text-primary)">{order.customer_name ?? "No name given"}</span>
          {order.customer_phone ? ` · ${order.customer_phone}` : ""}
        </p>
      ) : (
        <p className="text-(length:--text-xs) text-(--text-muted)">
          No name or phone (placed before checkout collected these).
        </p>
      )}

      <ul className="flex flex-col gap-1.5 border-y border-(--border-default) py-3">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3 text-(length:--text-sm)">
            <span className="text-(--text-secondary)">
              {item.quantity}x {item.name}
              {item.size_label ? ` (${item.size_label})` : ""}
              {item.addons.length > 0 ? (
                <span className="text-(--text-muted)"> + {item.addons.map((a) => a.name).join(", ")}</span>
              ) : null}
            </span>
            <span className="shrink-0 font-medium text-(--text-primary)">{formatPrice(item.line_total)}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between">
        <span className="text-(length:--text-sm) font-semibold text-(--text-primary)">Total</span>
        <span className="text-(length:--text-sm) font-semibold text-(--text-primary)">
          {formatPrice(order.total_price)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setShowMessage((v) => !v)}
        className="flex items-center gap-1 self-start text-(length:--text-xs) text-(--text-muted) hover:text-(--text-secondary)"
      >
        <CaretDown size={12} weight="bold" className={showMessage ? "rotate-180" : ""} />
        {showMessage ? "Hide" : "View"} WhatsApp message
      </button>
      {showMessage ? (
        <pre className="whitespace-pre-wrap rounded-(--radius-md) bg-(--bg-page) p-3 text-(length:--text-xs) text-(--text-secondary)">
          {order.whatsapp_message}
        </pre>
      ) : null}
    </div>
  );
}
