"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { Menu, MenuItemRow } from "@/lib/menu/types";

const WHATSAPP_GREETING = "Hi Valhalla, I'd like to place an order.";
const WHATSAPP_URL = `https://wa.me/201000100115?text=${encodeURIComponent(WHATSAPP_GREETING)}`;

function pickHeroItems(menu: Menu): { primary: MenuItemRow | null; secondary: MenuItemRow | null } {
  const sweetCones = menu.find((c) => c.slug === "sweet-cones");
  const withImages = sweetCones?.menu_items.filter((i) => i.image_url) ?? [];

  const primary =
    withImages.find((i) => i.name_en === "Kinder") ??
    withImages[0] ??
    menu.flatMap((c) => c.menu_items).find((i) => i.image_url) ??
    null;

  const secondary =
    withImages.find((i) => i.name_en === "Pistachio" && i.id !== primary?.id) ??
    withImages.find((i) => i.id !== primary?.id) ??
    null;

  return { primary, secondary };
}

function scrollToMenu() {
  const el = document.getElementById("menu");
  if (!el) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

/**
 * Variance 8, second pass (2026-07-28). The first version was a clean
 * 50/50 split, real photo, no complaints on any individual rule, but
 * "clean 50/50 split with a rounded photo" is also exactly what the
 * skill calls the safe default. Pushed further: the image column bleeds
 * to the true viewport edge instead of sitting in a contained rounded
 * box (this section deliberately ignores the page's max-width container,
 * every other section keeps it), a second real photo is layered behind
 * the first for depth instead of one clean rectangle, and the text
 * panel overlaps into the image column on desktop via a negative margin
 * (Section 7's "-2rem overlap" move) rather than two columns that never
 * touch. The overlap is a solid, opaque panel sitting in front of the
 * image, never text directly on photo pixels, so contrast never depends
 * on what's underneath.
 */
export function Hero({ menu }: { menu: Menu }) {
  const { primary, secondary } = pickHeroItems(menu);

  return (
    <section className="relative min-h-[calc(100dvh-var(--header-height))] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 order-2 flex flex-col items-start gap-4 bg-(--bg-page) px-4 pb-10 pt-6 lg:order-1 lg:-mr-16 lg:justify-center lg:px-10 lg:py-16"
        >
          <h1 className="font-(family-name:--font-display) text-(length:--text-display-lg) leading-(--leading-tight) tracking-(--tracking-tight) text-(--text-primary)">
            Hall of <span className="text-(--accent-text)">Chimney</span> Cakes
          </h1>
          <p className="max-w-[34ch] text-(length:--text-md) text-(--text-secondary)">
            Sweet and savory chimney cones, classics and coffee, loaded fresh to order.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={scrollToMenu}
              className="rounded-(--radius-pill) bg-(--accent-solid) px-5 py-3 text-(length:--text-sm) font-medium text-(--text-on-accent) transition duration-(--duration-fast) hover:bg-(--accent-solid-hover) active:scale-[0.97]"
            >
              View Menu
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-(--radius-pill) border border-(--border-strong) px-5 py-3 text-(length:--text-sm) font-medium text-(--text-primary) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover) active:scale-[0.97]"
            >
              Order on WhatsApp
            </a>
          </div>
        </motion.div>

        {/*
          Not a motion.div on the primary image: it's the page's LCP
          element. Animating its opacity gates paint behind hydration,
          which measured as a real 4.1s LCP regression in Lighthouse. See
          git history / the step-6 report for the full trace.
        */}
        <div className="relative order-1 aspect-[4/3] w-full overflow-hidden bg-(--bg-unavailable) lg:order-2 lg:aspect-auto lg:h-[min(88dvh,52rem)]">
          {primary?.image_url ? (
            <Image
              src={primary.image_url}
              alt={`${primary.name_en}, a real chimney cake from Valhalla`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 65vw"
              className="object-cover"
            />
          ) : null}

          {secondary?.image_url ? (
            <div className="absolute -left-6 bottom-6 z-10 hidden aspect-square w-40 overflow-hidden rounded-(--radius-lg) border-4 border-(--bg-page) shadow-(--shadow-lg) lg:block xl:w-48">
              <Image
                src={secondary.image_url}
                alt={`${secondary.name_en}, a real chimney cake from Valhalla`}
                fill
                sizes="12rem"
                className="object-cover"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
