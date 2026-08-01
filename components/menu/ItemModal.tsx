"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { m } from "motion/react";
import { X } from "@phosphor-icons/react";
import { useMenuContext } from "@/lib/menu/menu-context";
import { ItemDetailContent } from "@/components/menu/ItemDetailContent";

/**
 * The intercepted presentation of /item/[id]: rendered as an overlay over
 * whatever grid the user was browsing, instead of a full page navigation,
 * via app/@modal/(.)item/[id]. Closing calls router.back() rather than a
 * passed-in callback, since the "open" state IS the URL now, there's
 * nothing else to reset. Same bottom-sheet-below-lg / floating-panel-at-lg
 * split as the cart drawer, for the same reachability reasons.
 *
 * Three responsive tiers, not two: below md it's a full-bleed bottom sheet
 * (right for a one-handed phone reach). At md (768, tablet portrait) it
 * stays a bottom sheet but gets capped to max-w-xl and centered, matching
 * the standalone /item/[id] page's own width, instead of stretching the
 * sheet edge-to-edge across a tablet-width viewport, which read as a
 * stretched phone layout, not a designed tablet one. At lg it becomes a
 * centered floating panel via `inset-0 m-auto`, not `left-1/2 top-1/2`
 * plus `-translate-x/y-1/2`: Motion owns this element's `transform` for
 * the slide-up entrance (`animate={{ y: 0 }}` sets an inline transform
 * every render), which silently overwrites any translate-based centering
 * from a class, since inline styles always win over stylesheet rules.
 * `inset-0` + `margin: auto` centers without touching `transform` at all,
 * so it composes with Motion's own transform instead of losing to it.
 *
 * Takes an id, not a fetched item: app/@modal/(.)item/[id]/page.tsx used
 * to call getMenuItemById (a real Supabase round trip) on every single
 * tap, which was the actual "lag" a real production report traced back
 * to (measured 176-351ms server time on top of the round trip itself).
 * The route can't be made static to skip that server hop, that's the
 * Vercel/interception problem documented in CLAUDE.md, but it doesn't
 * need Supabase at all: the exact same item's full data is already
 * sitting in memory, since you can only reach this modal by tapping a
 * card that was itself rendered from the already-loaded menu (see
 * MenuProvider, lib/menu/menu-context.tsx). Reading it from there
 * instead means this route's server render does zero external I/O, and
 * the modal itself never has a loading state in the common case, it has
 * everything it needs the instant it mounts. The lookup only fails if
 * the item was deleted from the menu in the exact window between the
 * page loading and the tap, genuinely rare, handled below rather than
 * assumed away.
 */
export function ItemModal({ id }: { id: string }) {
  const router = useRouter();
  const item = useMenuContext().getItemById(id);

  function close() {
    router.back();
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeButton = (
    <button
      type="button"
      onClick={close}
      aria-label="Close"
      className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-(--radius-pill) bg-(--bg-page)/80 text-(--text-secondary) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover) active:scale-90"
    >
      <X size={18} />
    </button>
  );

  return (
    <>
      <m.div
        className="fixed inset-0 z-(--z-modal) bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={close}
      />
      <m.div
        role="dialog"
        aria-modal="true"
        aria-label={item?.name_en ?? "Item unavailable"}
        className="fixed inset-x-0 bottom-0 z-(--z-modal) flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-(--radius-lg) bg-(--bg-page) shadow-(--shadow-lg) md:max-w-xl md:mx-auto lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[85dvh] lg:w-full lg:max-w-lg lg:rounded-(--radius-lg)"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-(--radius-pill) bg-(--border-strong) lg:hidden" />
        {item ? (
          <div className="overflow-y-auto">
            <ItemDetailContent
              item={item}
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 576px, 512px"
              onAdded={close}
              topRightSlot={closeButton}
            />
          </div>
        ) : (
          // Only reachable if the item was deleted from the menu in the
          // exact window between page load and tap, see this file's own
          // comment above.
          <div className="relative flex flex-col items-center gap-2 px-6 py-16 text-center">
            {closeButton}
            <p className="text-(length:--text-md) font-medium text-(--text-primary)">
              This item is no longer available.
            </p>
            <p className="max-w-xs text-(length:--text-sm) text-(--text-secondary)">
              It may have been removed from the menu. Go back and take another look.
            </p>
          </div>
        )}
      </m.div>
    </>
  );
}
