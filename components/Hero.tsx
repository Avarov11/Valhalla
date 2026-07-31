"use client";

import Image from "next/image";
import { m } from "motion/react";
import valMark from "@/val.png";

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
 * detail page, nothing else". The brand name itself becomes the graphic
 * form instead: an oversized "VALHALLA" wordmark bleeds off the right
 * edge at low contrast (the --border-default token, already tuned to sit
 * just barely above the page background in both themes) as a background
 * texture, while the real, readable headline sits left-aligned and
 * unweighted by it. Not centred, not a photo with text on top, four text
 * elements total (headline, subtext, two CTAs), two-line headline.
 * No forced min-h-[100dvh]: height is intrinsic to the content so both
 * CTAs land inside the first viewport at 390 and at 1024 regardless of
 * exact device height, rather than being pushed down by an artificially
 * tall, vertically-centred section.
 *
 * EXPERIMENT (2026-07-31): the background wordmark is val.png itself
 * (a raster PNG) rather than live "VALHALLA" text, replacing the
 * Kaushan Script attempt from earlier the same day. Two real costs
 * versus live text, being tried anyway on request: val.png is a 902px
 * source scaled to roughly viewport width here, some softening at
 * large sizes is expected, not a bug. And it can't hue-match
 * --border-default's exact pale tan the way text could; --logo-invert
 * (globals.css) flips it black/white per theme same as the header
 * logo, then opacity stands in for "low contrast" instead of a themed
 * colour.
 *
 * One size/position for every breakpoint (w-[100vw], -right-[2vw],
 * -top-[3vw]), no lg override, matching exactly how the live-text
 * version behaved before this swap (text-[22vw], -right-[0.06em],
 * -top-[0.1em], no lg variant either). Three earlier attempts at a
 * separate lg treatment (capped+cornered, dead-centred, small+offset)
 * all got overridden by request in favour of this, going back to the
 * original's own uncapped, single-rule approach, just with the image
 * standing in for the text. If a genuinely wide desktop makes it read
 * as too dominant again, that was already true of the original text at
 * the same width, it's not a regression this swap introduced.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-(--border-default) bg-(--bg-page)">
      <Image
        src={valMark}
        alt=""
        aria-hidden="true"
        priority
        className="pointer-events-none absolute -right-[2vw] -top-[3vw] w-[100vw] max-w-none select-none opacity-[0.16] [filter:var(--logo-invert)]"
      />

      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto flex max-w-(--page-max-width) flex-col gap-5 px-4 py-14 sm:py-16 lg:gap-6 lg:px-10 lg:py-20"
      >
        <h1 className="font-(family-name:--font-display) text-(length:--text-display-lg) leading-(--leading-tight) tracking-(--tracking-tighter) text-(--text-primary)">
          <span className="block">A warm hall.</span>
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
