"use client";

import { motion } from "motion/react";
import { ShoppingCart } from "@phosphor-icons/react";
import { ThemeToggle } from "@/components/ThemeToggle";

type HeaderProps = {
  itemCount: number;
  onOpenCart: () => void;
};

export function Header({ itemCount, onOpenCart }: HeaderProps) {
  return (
    <header className="sticky top-0 z-(--z-header) flex h-(--header-height) items-center justify-between border-b border-(--border-default) bg-(--bg-page) px-4">
      <span className="font-(family-name:--font-display) text-(length:--text-xl) tracking-(--tracking-tight) text-(--text-primary)">
        Valhalla
      </span>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <button
          type="button"
          onClick={onOpenCart}
          aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-(--radius-pill) border border-(--border-default) text-(--text-secondary) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover) active:scale-90"
        >
          <ShoppingCart size={18} />
          {itemCount > 0 ? (
            // key={itemCount} forces a remount on every change, so the pop-in
            // (feedback that the cart actually updated) replays each time,
            // not just the first time the badge appears.
            <motion.span
              key={itemCount}
              initial={{ scale: 1.35 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-(--radius-pill) bg-(--accent-solid) px-1 text-[10px] font-semibold text-(--text-on-accent)"
            >
              {itemCount > 99 ? "99+" : itemCount}
            </motion.span>
          ) : null}
        </button>
      </div>
    </header>
  );
}
