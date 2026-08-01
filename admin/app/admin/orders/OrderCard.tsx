"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CaretDown, Trash } from "@phosphor-icons/react";
import { ORDER_STATUSES, STATUS_COLOR, STATUS_LABELS, type Order, type OrderStatus } from "@/lib/admin/order-status";
import { formatPrice } from "@/lib/menu/format";
import { setOrderStatus, deleteOrder } from "./actions";

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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
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

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteOrder(order.id);
      if (!result.ok) {
        setError(result.error);
        setIsConfirmingDelete(false);
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
            style={{ backgroundColor: STATUS_COLOR[order.status] }}
          />
          <span className="text-(length:--text-sm) font-medium text-(--text-primary)">{formatDate(order.created_at)}</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={order.status}
            onChange={handleStatusChange}
            disabled={isPending}
            className="rounded-(--radius-pill) border border-(--border-default) bg-(--bg-page) px-3 py-1.5 text-(length:--text-xs) font-medium text-(--text-primary) disabled:opacity-60"
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            disabled={isPending}
            aria-label="Delete order"
            className="flex h-8 w-8 items-center justify-center rounded-(--radius-pill) border border-(--border-default) text-(--text-secondary) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover) disabled:opacity-60"
          >
            <Trash size={14} />
          </button>
        </div>
      </div>

      {error ? <p className="text-(length:--text-xs) text-(--accent-text)">{error}</p> : null}

      {isConfirmingDelete ? (
        <div className="flex items-center gap-3 rounded-(--radius-md) bg-(--bg-unavailable) px-3 py-2 text-(length:--text-sm)">
          <span className="flex-1 text-(--text-primary)">Delete this order? This is permanent.</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-(--radius-pill) bg-(--accent-solid) px-3 py-1.5 text-(length:--text-xs) font-semibold text-(--text-on-accent) disabled:opacity-60"
          >
            Confirm delete
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(false)}
            disabled={isPending}
            className="rounded-(--radius-pill) border border-(--border-default) px-3 py-1.5 text-(length:--text-xs) font-medium text-(--text-secondary)"
          >
            Cancel
          </button>
        </div>
      ) : null}

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
