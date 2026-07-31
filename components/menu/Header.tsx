"use client";

import Image from "next/image";
import { m } from "motion/react";
import { ShoppingCart } from "@phosphor-icons/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoMark from "@/logo.png";

type HeaderProps = {
  itemCount: number;
  onOpenCart: () => void;
};

/**
 * Below lg: logo mark and theme toggle only, "low-frequency controls" per
 * REDESIGN.md, since menu/search/cart moved to BottomBar for one-handed
 * reach. At lg and up, where BottomBar is hidden, the cart button comes
 * back here since there's no other persistent place for it.
 *
 * The mark is the only brand identifier here now, no adjacent text
 * naming it, so it carries real alt text rather than alt="". --logo-invert
 * (globals.css) flips it from black to white in dark mode via CSS
 * filter, since it's a single pure-black-ink asset, not a light/dark pair.
 */
export function Header({ itemCount, onOpenCart }: HeaderProps) {
  return (
    <header className="sticky top-0 z-(--z-header) flex h-(--header-height) items-center justify-between border-b border-(--border-default) bg-(--bg-page) px-4 lg:px-6">
      <Image
        src={logoMark}
        alt="Valhalla"
        className="h-8 w-auto [filter:var(--logo-invert)]"
        priority
      />

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <button
          type="button"
          onClick={onOpenCart}
          aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
          className="relative hidden h-11 w-11 shrink-0 items-center justify-center rounded-(--radius-pill) border border-(--border-default) text-(--text-secondary) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover) active:scale-90 lg:flex"
        >
          <ShoppingCart size={18} />
          {itemCount > 0 ? (
            <m.span
              key={itemCount}
              initial={{ scale: 1.35 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-(--radius-pill) bg-(--accent-solid) px-1 text-[10px] font-semibold text-(--text-on-accent)"
            >
              {itemCount > 99 ? "99+" : itemCount}
            </m.span>
          ) : null}
        </button>
      </div>
    </header>
  );
}
