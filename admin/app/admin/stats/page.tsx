import { ArrowsClockwise } from "@phosphor-icons/react/dist/ssr/ArrowsClockwise";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { Package } from "@phosphor-icons/react/dist/ssr/Package";
import { Star } from "@phosphor-icons/react/dist/ssr/Star";
import { Tag } from "@phosphor-icons/react/dist/ssr/Tag";
import { getAdminMenu } from "@/lib/admin/get-admin-menu";
import { formatPrice } from "@/lib/menu/format";

// See products/page.tsx's comment: same switch from force-dynamic to a
// short ISR window, same reasoning.
export const revalidate = 30;

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function StatTile({
  icon,
  color,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) p-4">
      <div className="flex items-center justify-between">
        <span className="text-(length:--text-xs) font-medium uppercase tracking-(--tracking-wide) text-(--text-muted)">
          {label}
        </span>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-(--radius-pill)"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
        >
          {icon}
        </span>
      </div>
      <span className="text-(length:--text-2xl) font-semibold text-(--text-primary)">{value}</span>
      {sublabel ? <span className="text-(length:--text-xs) text-(--text-secondary)">{sublabel}</span> : null}
    </div>
  );
}

/**
 * Same-ramp track, one hue, filled to the ratio: the dataviz skill's own
 * "single ratio against a limit" form (references/choosing-a-form.md),
 * not a 2-slice donut, which that same guidance names as the wrong tool
 * for exactly this job.
 */
function Meter({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-(length:--text-sm) text-(--text-secondary)">{label}</span>
        <span className="text-(length:--text-sm) font-semibold text-(--text-primary)">
          {count} / {total} <span className="text-(--text-muted)">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-(--radius-pill) bg-(--bg-unavailable)">
        <div className="h-full rounded-(--radius-pill)" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-(length:--text-xs) text-(--text-secondary)">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-(--radius-pill) bg-(--bg-unavailable)">
        <div className="h-full rounded-(--radius-pill) bg-(--accent-solid)" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 shrink-0 text-right text-(length:--text-xs) text-(--text-muted)">{count}</span>
    </div>
  );
}

export default async function AdminStatsPage() {
  const menu = await getAdminMenu();
  const items = menu.flatMap((c) => c.menu_items);
  const now = new Date();

  const totalItems = items.length;
  const availableCount = items.filter((i) => i.is_available).length;
  const popularCount = items.filter((i) => i.is_popular).length;
  const sizedCount = items.filter((i) => i.item_sizes.length > 0).length;
  const flatItems = items.filter((i) => i.item_sizes.length === 0 && i.price !== null);
  const withPhotoCount = items.filter((i) => i.image_url).length;
  const withAddonsCount = items.filter((i) => i.item_addon_groups.length > 0).length;
  const rated = items.filter((i) => i.rating_count > 0 && i.rating_average !== null);

  const flatPrices = flatItems.map((i) => i.price as number);
  const avgPrice = flatPrices.length > 0 ? flatPrices.reduce((a, b) => a + b, 0) / flatPrices.length : null;
  const minPrice = flatPrices.length > 0 ? Math.min(...flatPrices) : null;
  const maxPrice = flatPrices.length > 0 ? Math.max(...flatPrices) : null;
  const avgRating =
    rated.length > 0 ? rated.reduce((sum, i) => sum + (i.rating_average as number), 0) / rated.length : null;

  const categoryCounts = menu.map((c) => ({ name: c.name_en, count: c.menu_items.length }));
  const maxCategoryCount = Math.max(1, ...categoryCounts.map((c) => c.count));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-(length:--text-sm) text-(--text-muted)">
            {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 font-(family-name:--font-display) text-(length:--text-2xl) text-(--text-primary)">
            {greeting(now.getHours())}, Admin
          </h1>
        </div>
        {/* Was "Updated just now", accurate back when this page was
            force-dynamic. Not honest to claim anymore now that it
            carries a 30s ISR window (see this file's revalidate
            export) and could genuinely be serving a page rendered up
            to 30s ago. Any write still invalidates this immediately
            via revalidatePath, this note is only about the no-write
            steady state. */}
        <span className="flex items-center gap-1.5 pt-1 text-(length:--text-xs) text-(--text-muted)">
          <ArrowsClockwise size={14} />
          Live within 30s
        </span>
      </div>

      {/* Revenue deliberately isn't a number: no order is ever saved to the
          database, the WhatsApp checkout flow is fire-and-forget (see
          CLAUDE.md, Admin dashboard). Showing $0 or a guess would be
          exactly the kind of fabricated business data this project has
          refused to do anywhere else (real facts only, see CLAUDE.md,
          Content). Styled like a KPI tile so it sits honestly among the
          real ones instead of looking like an afterthought, dashed
          border and a dash for a value says "not tracked", not "zero". */}
      <div className="flex items-center justify-between gap-4 rounded-(--radius-md) border border-dashed border-(--border-strong) bg-(--bg-surface) p-4">
        <div>
          <span className="text-(length:--text-xs) font-medium uppercase tracking-(--tracking-wide) text-(--text-muted)">
            Revenue
          </span>
          <p className="mt-1 text-(length:--text-2xl) font-semibold text-(--text-muted)">—</p>
        </div>
        <p className="max-w-md text-right text-(length:--text-xs) text-(--text-secondary)">
          Not tracked yet. No order is saved to the database, checkout hands off to WhatsApp directly. This
          fills in once an orders table exists, see the Orders tab.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={<Package size={16} weight="bold" />}
          color="var(--admin-stat-blue)"
          label="Total items"
          value={String(totalItems)}
        />
        <StatTile
          icon={<Tag size={16} weight="bold" />}
          color="var(--admin-stat-orange)"
          label="Categories"
          value={String(menu.length)}
        />
        <StatTile
          icon={<CheckCircle size={16} weight="bold" />}
          color="var(--admin-stat-aqua)"
          label="Available now"
          value={String(availableCount)}
          sublabel={`${totalItems - availableCount} sold out`}
        />
        <StatTile
          icon={<Star size={16} weight="bold" />}
          color="var(--admin-stat-violet)"
          label="Marked popular"
          value={String(popularCount)}
        />
      </div>

      <section>
        <h2 className="mb-3 text-(length:--text-lg) font-semibold text-(--text-primary)">Availability</h2>
        <div className="rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) p-4">
          <Meter label="In stock" count={availableCount} total={totalItems} color="var(--admin-status-good)" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-(length:--text-lg) font-semibold text-(--text-primary)">Items per category</h2>
        <div className="flex flex-col gap-2 rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) p-4">
          {categoryCounts.map((c) => (
            <BarRow key={c.name} label={c.name} count={c.count} max={maxCategoryCount} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section>
          <h2 className="mb-3 text-(length:--text-lg) font-semibold text-(--text-primary)">Pricing</h2>
          <div className="flex flex-col gap-3 rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) p-4">
            {avgPrice !== null ? (
              <>
                <div className="flex justify-between text-(length:--text-sm)">
                  <span className="text-(--text-secondary)">Average (flat-price items)</span>
                  <span className="font-medium text-(--text-primary)">{formatPrice(avgPrice)}</span>
                </div>
                <div className="flex justify-between text-(length:--text-sm)">
                  <span className="text-(--text-secondary)">Lowest</span>
                  <span className="font-medium text-(--text-primary)">{formatPrice(minPrice as number)}</span>
                </div>
                <div className="flex justify-between text-(length:--text-sm)">
                  <span className="text-(--text-secondary)">Highest</span>
                  <span className="font-medium text-(--text-primary)">{formatPrice(maxPrice as number)}</span>
                </div>
              </>
            ) : (
              <p className="text-(length:--text-sm) text-(--text-muted)">No flat-priced items.</p>
            )}
            <div className="flex justify-between border-t border-(--border-default) pt-3 text-(length:--text-sm)">
              <span className="text-(--text-secondary)">Sized items (own price per size)</span>
              <span className="font-medium text-(--text-primary)">{sizedCount}</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-(length:--text-lg) font-semibold text-(--text-primary)">Coverage</h2>
          <div className="flex flex-col gap-3 rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) p-4">
            <div className="flex justify-between text-(length:--text-sm)">
              <span className="text-(--text-secondary)">Have a photo</span>
              <span className="font-medium text-(--text-primary)">
                {withPhotoCount} / {totalItems}
              </span>
            </div>
            <div className="flex justify-between text-(length:--text-sm)">
              <span className="text-(--text-secondary)">Have add-ons</span>
              <span className="font-medium text-(--text-primary)">
                {withAddonsCount} / {totalItems}
              </span>
            </div>
            <div className="flex justify-between text-(length:--text-sm)">
              <span className="text-(--text-secondary)">Have a real rating entered</span>
              <span className="font-medium text-(--text-primary)">
                {rated.length} / {totalItems}
              </span>
            </div>
            {avgRating !== null ? (
              <div className="flex justify-between border-t border-(--border-default) pt-3 text-(length:--text-sm)">
                <span className="text-(--text-secondary)">Average of rated items</span>
                <span className="font-medium text-(--text-primary)">{avgRating.toFixed(1)} / 5</span>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
