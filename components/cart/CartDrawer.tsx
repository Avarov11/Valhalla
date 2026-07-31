"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, m } from "motion/react";
import { Minus, Plus, WarningCircle, X } from "@phosphor-icons/react";
import type { ResolvedCartLine, RemovedNotice } from "@/lib/cart/types";
import { formatPrice } from "@/lib/menu/format";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  lines: ResolvedCartLine[];
  removedNotices: RemovedNotice[];
  onDismissNotices: () => void;
  onUpdateQuantity: (itemId: string, sizeLabel: string | null, addonOptionIds: string[], quantity: number) => void;
  onRemove: (itemId: string, sizeLabel: string | null, addonOptionIds: string[]) => void;
  grandTotal: number;
  whatsappUrl: string;
  whatsappTruncated: boolean;
};

function removalReason(notice: RemovedNotice): string {
  switch (notice.reason) {
    case "unavailable":
      return "it is sold out right now";
    case "deleted":
      return "it is no longer on the menu";
    case "size-changed":
      return "that option is no longer available";
    case "addon-changed":
      return "one of its extras is no longer available";
  }
}

/**
 * Below lg, the panel is a bottom sheet: content-sized up to a max height,
 * not stretched to fill the viewport, so a cart with one item does not
 * leave a dead empty void above the total. At lg and up it reverts to a
 * top-right anchored panel (a right-side slide-in reads as a desktop
 * pattern, not a touch one) that is still content-sized rather than
 * full height, for the same reason. The two need different Motion
 * entrance axes (up for a sheet, in-from-the-right for a corner panel),
 * which can only be chosen in JS, not via responsive classes alone.
 *
 * At md (768, tablet portrait) the sheet stays bottom-anchored but gets
 * capped to max-w-xl and centered (`mx-auto`), rather than stretching
 * edge-to-edge across a tablet-width viewport like a stretched phone
 * sheet. Plain margin auto, not a translate, is deliberate here too, see
 * ItemModal.tsx for why that matters once Motion is animating the same
 * element (this panel's lg+ position doesn't use translate, so it isn't
 * at risk the same way, but the pattern stays consistent either way).
 */
function useIsDesktopCart() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    function handleChange(e: MediaQueryListEvent) {
      setIsDesktop(e.matches);
    }
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  return isDesktop;
}

export function CartDrawer({
  open,
  onClose,
  lines,
  removedNotices,
  onDismissNotices,
  onUpdateQuantity,
  onRemove,
  grandTotal,
  whatsappUrl,
  whatsappTruncated,
}: CartDrawerProps) {
  const isDesktop = useIsDesktopCart();

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <m.div
            key="cart-overlay"
            className="fixed inset-0 z-(--z-cart-sheet) bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <m.div
            key="cart-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Cart"
            className="fixed inset-x-0 bottom-0 z-(--z-cart-sheet) flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-(--radius-lg) bg-(--bg-page) shadow-(--shadow-lg) md:max-w-xl md:mx-auto lg:inset-x-auto lg:mx-0 lg:left-auto lg:right-6 lg:top-6 lg:bottom-auto lg:max-h-[calc(100dvh-3rem)] lg:w-full lg:max-w-md lg:rounded-(--radius-lg)"
            initial={isDesktop ? { x: "100%" } : { y: "100%" }}
            animate={isDesktop ? { x: 0 } : { y: 0 }}
            exit={isDesktop ? { x: "100%" } : { y: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-(--radius-pill) bg-(--border-strong) lg:hidden" />

            <div className="flex items-center justify-between border-b border-(--border-default) px-4 py-3">
              <h2 className="font-(family-name:--font-display) text-(length:--text-lg) text-(--text-primary)">
                Your order
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close cart"
                className="flex h-11 w-11 items-center justify-center rounded-(--radius-pill) text-(--text-secondary) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover) active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            {removedNotices.length > 0 ? (
              <div className="flex items-center gap-2 border-b border-(--border-default) bg-(--bg-unavailable) px-4 py-3 text-(length:--text-sm) text-(--text-secondary)">
                <WarningCircle size={18} className="shrink-0" />
                <div className="flex-1">
                  {removedNotices.map((notice, i) => (
                    <p key={i}>
                      {notice.name} was removed, {removalReason(notice)}.
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onDismissNotices}
                  aria-label="Dismiss notice"
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-(--text-muted)"
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {lines.length === 0 ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-center text-(--text-secondary)">
                  <p className="text-(length:--text-sm)">Your cart is empty.</p>
                  <p className="text-(length:--text-xs) text-(--text-muted)">
                    Add something from the menu to get started.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-4">
                  {lines.map((line) => (
                    <li
                      key={`${line.itemId}-${line.sizeLabel ?? "flat"}-${line.addonOptionIds.join(",")}`}
                      className="flex gap-3"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-(--radius-md) bg-(--bg-unavailable)">
                        {line.imageUrl ? (
                          <Image
                            src={line.imageUrl}
                            alt={line.name}
                            fill
                            sizes="4rem"
                            className="object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="flex-1">
                        <p className="text-(length:--text-sm) font-medium text-(--text-primary)">
                          {line.name}
                          {line.sizeLabel ? ` (${line.sizeLabel})` : ""}
                        </p>
                        {line.addons.length > 0 ? (
                          <p className="text-(length:--text-xs) text-(--text-secondary)">
                            + {line.addons.map((a) => a.name).join(", ")}
                          </p>
                        ) : null}
                        <p className="text-(length:--text-xs) text-(--text-muted)">
                          {formatPrice(line.unitPrice)} each
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(line.itemId, line.sizeLabel, line.addonOptionIds, line.quantity - 1)
                            }
                            aria-label={`Decrease quantity of ${line.name}`}
                            className="flex h-11 w-11 items-center justify-center rounded-(--radius-pill) border border-(--border-default) text-(--text-secondary) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover) active:scale-[0.92]"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center text-(length:--text-sm) text-(--text-primary)">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(line.itemId, line.sizeLabel, line.addonOptionIds, line.quantity + 1)
                            }
                            aria-label={`Increase quantity of ${line.name}`}
                            className="flex h-11 w-11 items-center justify-center rounded-(--radius-pill) border border-(--border-default) text-(--text-secondary) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover) active:scale-[0.92]"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <span className="text-(length:--text-sm) font-semibold text-(--text-primary)">
                          {formatPrice(line.lineTotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemove(line.itemId, line.sizeLabel, line.addonOptionIds)}
                          aria-label={`Remove ${line.name} from cart`}
                          className="flex min-h-11 items-center text-(length:--text-xs) text-(--text-muted) underline active:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-(--border-default) px-4 py-3">
              <div className="flex items-center justify-between text-(length:--text-md) font-semibold text-(--text-primary)">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
              <p className="mt-1 text-(length:--text-xs) text-(--text-muted)">Prices include taxes</p>
              <p className="font-(family-name:--font-arabic) text-(length:--text-xs) text-(--text-muted)">
                السعر شامل القيمة المضافة
              </p>

              {whatsappTruncated ? (
                <p className="mt-2 text-(length:--text-xs) text-(--text-muted)">
                  The order message was shortened for WhatsApp. The total above already includes every
                  item.
                </p>
              ) : null}

              <a
                href={lines.length > 0 ? whatsappUrl : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={lines.length === 0}
                onClick={(e) => {
                  if (lines.length === 0) e.preventDefault();
                }}
                className={`mt-3 flex w-full items-center justify-center rounded-(--radius-pill) px-4 py-3 text-(length:--text-sm) font-medium text-(--text-on-accent) transition duration-(--duration-fast) ${
                  lines.length > 0
                    ? "bg-(--accent-solid) hover:bg-(--accent-solid-hover) active:scale-[0.98]"
                    : "cursor-not-allowed bg-(--bg-unavailable) text-(--text-muted)"
                }`}
              >
                Order on WhatsApp
              </a>
            </div>
          </m.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
