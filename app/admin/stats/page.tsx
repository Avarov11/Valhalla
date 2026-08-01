import { getAdminMenu } from "@/lib/admin/get-admin-menu";
import { formatPrice } from "@/lib/menu/format";

export const dynamic = "force-dynamic";

function StatCard({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) p-4">
      <span className="text-(length:--text-xs) text-(--text-muted)">{label}</span>
      <span className="font-(family-name:--font-display) text-(length:--text-2xl) text-(--text-primary)">{value}</span>
      {sublabel ? <span className="text-(length:--text-xs) text-(--text-secondary)">{sublabel}</span> : null}
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
      <div>
        <h1 className="font-(family-name:--font-display) text-(length:--text-2xl) text-(--text-primary)">Stats</h1>
        <p className="mt-1 text-(length:--text-sm) text-(--text-secondary)">
          Everything here is computed live from the current catalog. Nothing is invented.
        </p>
      </div>

      {/* Revenue deliberately isn't a number: no order is ever saved to the
          database, the WhatsApp checkout flow is fire-and-forget (see
          CLAUDE.md, Admin dashboard). Showing $0 or a guess would be
          exactly the kind of fabricated business data this project has
          refused to do anywhere else (real facts only, see CLAUDE.md,
          Content). This card says so plainly instead of hiding the gap. */}
      <div className="rounded-(--radius-md) border border-(--accent-border-subtle) bg-(--accent-subtle-bg) p-4">
        <p className="text-(length:--text-sm) font-medium text-(--accent-text)">Revenue: not available</p>
        <p className="mt-1 text-(length:--text-xs) text-(--text-secondary)">
          No order is ever saved anywhere, the WhatsApp checkout flow doesn&rsquo;t write to the database. This
          will show real numbers once an orders table exists to compute them from, see the Orders tab.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total items" value={String(totalItems)} />
        <StatCard label="Categories" value={String(menu.length)} />
        <StatCard
          label="Available now"
          value={String(availableCount)}
          sublabel={`${totalItems - availableCount} sold out`}
        />
        <StatCard label="Marked popular" value={String(popularCount)} />
      </div>

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
