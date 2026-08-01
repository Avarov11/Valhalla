"use client";

import { m } from "motion/react";

const WHATSAPP_GREETING = "Hi Valhalla, I'd like to place an order.";
const WHATSAPP_URL = `https://wa.me/201000100115?text=${encodeURIComponent(WHATSAPP_GREETING)}`;

function scrollToMenu() {
  const el = document.getElementById("menu");
  if (!el) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

/**
 * Redesign (2026-07-29): no food photograph anywhere in this section, per
 * REDESIGN.md, "photography is reserved for the menu card and the item
 * detail page, nothing else". Four text elements total (headline, subtext,
 * two CTAs), two-line headline, left-aligned, not centred.
 *
 * 2026-07-29 through 2026-07-31 this section also carried a giant
 * low-contrast "VALHALLA" wordmark bleeding off the right edge as a
 * background texture, tried first as live text, then Kaushan Script,
 * then a val.png raster image. Removed entirely by request (2026-07-31):
 * no wordmark, no background texture, just the four text elements. If a
 * background device is wanted here again, that's a new decision, not a
 * revival of any of the three prior attempts.
 *
 * No forced min-h-[100dvh]: height is intrinsic to the content so both
 * CTAs land inside the first viewport at 390 and at 1024 regardless of
 * exact device height, rather than being pushed down by an artificially
 * tall, vertically-centred section.
 */
export function Hero() {
  return (
    <section className="relative border-b border-(--border-default) bg-(--bg-page)">
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto flex max-w-(--page-max-width) flex-col gap-5 px-4 py-14 sm:py-16 lg:gap-6 lg:px-10 lg:py-20"
      >
        <h1 className="font-(family-name:--font-display) text-(length:--text-display-lg) leading-(--leading-tight) tracking-(--tracking-tighter) text-(--text-primary)">
          {/* The {" "} is a real space character in the text content, not
              just visual spacing: `block` display gives the two-line look,
              but adjacent JSX elements have no whitespace between them by
              default, so anything reading the raw text (a screen reader,
              copy-paste, search indexing) saw "A warm hall.Real chimney
              cake." run together with no separator. A whitespace-only text
              node between two block boxes is discarded from layout per
              the CSS spec, so this doesn't introduce a visible gap. */}
          <span className="block">A warm hall.</span>{" "}
          <span className="block text-(--accent-text)">Real chimney cake.</span>
        </h1>

        <p className="max-w-[30ch] text-(length:--text-md) text-(--text-secondary)">
          Sweet and savory cones, classics, and coffee, loaded fresh and ordered on WhatsApp.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={scrollToMenu}
            className="flex min-h-11 items-center rounded-(--radius-pill) bg-(--accent-solid) px-6 py-3 text-(length:--text-sm) font-semibold text-(--text-on-accent) transition duration-(--duration-fast) hover:bg-(--accent-solid-hover) active:scale-[0.97]"
          >
            View Menu
          </button>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center rounded-(--radius-pill) border border-(--border-strong) px-6 py-3 text-(length:--text-sm) font-semibold text-(--text-primary) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover) active:scale-[0.97]"
          >
            Order on WhatsApp
          </a>
        </div>
      </m.div>
    </section>
  );
}
