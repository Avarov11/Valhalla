import { formatPrice } from "@/lib/menu/format";
import type { Order } from "@/lib/admin/get-admin-orders";

type DayBucket = { key: string; label: string; total: number; isToday: boolean };

function lastSevenDays(orders: Order[], now: Date): DayBucket[] {
  const days: DayBucket[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const total = orders
      .filter((o) => o.status !== "cancelled" && new Date(o.created_at).toDateString() === key)
      .reduce((sum, o) => sum + o.total_price, 0);
    days.push({
      key,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      total,
      isToday: i === 0,
    });
  }
  return days;
}

/**
 * One hue (--admin-stat-blue, matching the Revenue KPI tile above it),
 * thin bars, 4px rounded data-ends anchored to the baseline, recessive
 * gridlines - the dataviz skill's plain magnitude-over-time spec. A
 * bar chart, not a line: with mostly-zero days and one real order so
 * far, discrete daily totals read honestly as bars, a line would draw
 * a misleading slope between unrelated single-day figures.
 */
export function RevenueTrendChart({ orders, now }: { orders: Order[]; now: Date }) {
  const days = lastSevenDays(orders, now);
  const max = Math.max(1, ...days.map((d) => d.total));

  return (
    <div>
      <div className="relative flex h-40 items-end gap-3 border-b border-(--border-default)">
        {[0.25, 0.5, 0.75].map((f) => (
          <div
            key={f}
            className="pointer-events-none absolute inset-x-0 border-t border-(--border-default)"
            style={{ bottom: `${f * 100}%`, opacity: 0.5 }}
          />
        ))}
        {days.map((d) => (
          <div key={d.key} className="relative z-10 flex flex-1 flex-col items-center justify-end gap-1.5">
            <div
              title={`${d.label}: ${formatPrice(d.total)}`}
              className="w-full max-w-9 rounded-t bg-(--admin-stat-blue)"
              style={{ height: d.total > 0 ? `${Math.max(4, (d.total / max) * 100)}%` : "2px" }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-3">
        {days.map((d) => (
          <span
            key={d.key}
            className={`flex-1 text-center text-(length:--text-xs) ${
              d.isToday ? "font-semibold text-(--text-primary)" : "text-(--text-muted)"
            }`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
