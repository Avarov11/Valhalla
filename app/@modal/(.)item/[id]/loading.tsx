/**
 * Shown instantly while the (now trivial, no-Supabase) server segment
 * resolves, insurance for a tap that beats prefetch or a slow
 * connection, see ItemModal.tsx's own comment for why this route can't
 * just skip the server hop entirely. Same outer shape/sizing as the
 * real modal (ItemModal.tsx) so there's no layout jump when the real
 * content swaps in, image box included at the correct aspect-square so
 * it never reads as a blank flash before the photo has a home to land
 * in.
 */
export default function ModalLoading() {
  return (
    <>
      <div className="fixed inset-0 z-(--z-modal) bg-black/40" />
      <div
        role="status"
        aria-label="Loading item"
        className="fixed inset-x-0 bottom-0 z-(--z-modal) flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-(--radius-lg) bg-(--bg-page) shadow-(--shadow-lg) md:max-w-xl md:mx-auto lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[85dvh] lg:w-full lg:max-w-lg lg:rounded-(--radius-lg)"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-(--radius-pill) bg-(--border-strong) lg:hidden" />
        <div className="relative aspect-square w-full shrink-0 animate-pulse bg-(--bg-photo-panel)" />
        <div className="flex flex-col gap-3 p-5 sm:p-6">
          <div className="h-7 w-2/3 animate-pulse rounded-(--radius-sm) bg-(--bg-unavailable)" />
          <div className="h-4 w-full animate-pulse rounded-(--radius-sm) bg-(--bg-unavailable)" />
          <div className="h-4 w-4/5 animate-pulse rounded-(--radius-sm) bg-(--bg-unavailable)" />
          <div className="h-12 w-full animate-pulse rounded-(--radius-pill) bg-(--bg-unavailable)" />
        </div>
      </div>
    </>
  );
}
