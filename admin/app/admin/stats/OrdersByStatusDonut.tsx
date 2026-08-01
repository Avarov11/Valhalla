import { ORDER_STATUSES, STATUS_COLOR, STATUS_LABELS, type Order } from "@/lib/admin/order-status";

const SIZE = 160;
const STROKE = 24;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Four statuses, well inside the dataviz skill's categorical ceiling
 * (5-6 soft, 7-8 hard) - a genuinely different case from the 15-slice
 * category donut this project deliberately avoided elsewhere (see
 * CLAUDE.md, Admin dashboard, Visual redesign): that one failed the
 * ceiling, this one doesn't, so a donut is the right tool here, not a
 * bar. Color per segment comes from STATUS_COLOR, the same fixed
 * mapping OrderCard.tsx's status dot uses, so a status never means a
 * different color depending on which part of the dashboard you're
 * looking at. Legend to the side carries the label/count/percent text
 * (identity is never color-alone), each segment also gets a native
 * <title> tooltip on hover for the same info without adding a custom
 * tooltip component for a 4-slice admin-only chart.
 */
export function OrdersByStatusDonut({ orders }: { orders: Order[] }) {
  const total = orders.length;
  const counts = ORDER_STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    color: STATUS_COLOR[status],
    count: orders.filter((o) => o.status === status).length,
  }));

  let cumulative = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {total === 0 ? (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--bg-unavailable)"
              strokeWidth={STROKE}
            />
          ) : (
            counts.map((c) => {
              if (c.count === 0) return null;
              const length = (c.count / total) * CIRCUMFERENCE;
              const offset = -cumulative;
              cumulative += length;
              return (
                <circle
                  key={c.status}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={c.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                  strokeDashoffset={offset}
                >
                  <title>{`${c.label}: ${c.count} (${Math.round((c.count / total) * 100)}%)`}</title>
                </circle>
              );
            })
          )}
        </g>
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-(--text-primary)"
          style={{ fontSize: 26, fontWeight: 700 }}
        >
          {total}
        </text>
        <text
          x="50%"
          y="63%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-(--text-muted)"
          style={{ fontSize: 11 }}
        >
          orders
        </text>
      </svg>

      <ul className="flex flex-1 flex-col gap-2">
        {counts.map((c) => (
          <li key={c.status} className="flex items-center justify-between gap-3 text-(length:--text-sm)">
            <span className="flex items-center gap-2 text-(--text-secondary)">
              <span className="h-2.5 w-2.5 shrink-0 rounded-(--radius-pill)" style={{ backgroundColor: c.color }} />
              {c.label}
            </span>
            <span className="text-(--text-muted)">
              <span className="font-medium text-(--text-primary)">{c.count}</span>{" "}
              {total > 0 ? `(${Math.round((c.count / total) * 100)}%)` : "(0%)"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
