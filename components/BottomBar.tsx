"use client";

import { motion } from "motion/react";
import { ListMagnifyingGlass, MagnifyingGlass, ShoppingCart } from "@phosphor-icons/react";

type BottomBarProps = {
  itemCount: number;
  onMenu: () => void;
  onSearch: () => void;
  onCart: () => void;
};

/**
 * "Around half of phone users hold the device one-handed, and the
 * comfortable arc is the bottom centre of the screen... move the core
 * actions into a persistent bottom bar on phone and tablet." Hidden at lg
 * (1024 landscape and up), where the left sidebar and header cart button
 * take over: a two-thumb tablet or a mouse-driven desktop doesn't have
 * the one-handed reach problem this exists to solve.
 *
 * env(safe-area-inset-bottom) clears the iOS home indicator; the page's
 * own bottom padding (see globals.css) keeps the last section from
 * sitting underneath this bar.
 */
export function BottomBar({ itemCount, onMenu, onSearch, onCart }: BottomBarProps) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-(--z-bottom-bar) border-t border-(--border-default) bg-(--bg-surface) lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid h-(--bottom-bar-height) grid-cols-3">
        <button
          type="button"
          onClick={onMenu}
          className="flex flex-col items-center justify-center gap-0.5 text-(--text-secondary) transition duration-(--duration-fast) active:scale-95"
        >
          <ListMagnifyingGlass size={22} />
          <span className="text-(length:--text-xs) font-medium">Menu</span>
        </button>

        <button
          type="button"
          onClick={onSearch}
          className="flex flex-col items-center justify-center gap-0.5 text-(--text-secondary) transition duration-(--duration-fast) active:scale-95"
        >
          <MagnifyingGlass size={22} />
          <span className="text-(length:--text-xs) font-medium">Search</span>
        </button>

        <button
          type="button"
          onClick={onCart}
          aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
          className="relative flex flex-col items-center justify-center gap-0.5 text-(--text-secondary) transition duration-(--duration-fast) active:scale-95"
        >
          <span className="relative">
            <ShoppingCart size={22} />
            {itemCount > 0 ? (
              <motion.span
                key={itemCount}
                initial={{ scale: 1.35 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-(--radius-pill) bg-(--accent-solid) px-1 text-[10px] font-semibold text-(--text-on-accent)"
              >
                {itemCount > 99 ? "99+" : itemCount}
              </motion.span>
            ) : null}
          </span>
          <span aria-hidden="true" className="text-(length:--text-xs) font-medium">
            Cart
          </span>
        </button>
      </div>
    </nav>
  );
}
