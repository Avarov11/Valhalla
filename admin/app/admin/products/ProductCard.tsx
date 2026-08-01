"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, MagnifyingGlassPlus, X } from "@phosphor-icons/react";
import type { MenuItemRow } from "@/lib/menu/types";
import { formatPrice } from "@/lib/menu/format";
import { updateItemFields, setAvailability, setPopular, deleteItem, replacePhoto } from "./actions";

/**
 * One item as a card in a grid (was a dense table row; redesigned
 * 2026-08-01 by request, mainly to make the existing photo actually
 * visible and to separate "view it bigger" from "replace it" into two
 * distinct controls instead of one tiny 48px square doing both). Edit
 * still expands in place inside the card rather than a modal, same
 * reasoning as before: with 134 items, stacking dialogs on top of a
 * grid the owner is scanning is worse than one card growing taller.
 */
export function ProductCard({ item }: { item: MenuItemRow }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasSizes = item.item_sizes.length > 0;

  const [nameEn, setNameEn] = useState(item.name_en);
  const [nameAr, setNameAr] = useState(item.name_ar ?? "");
  const [description, setDescription] = useState(item.description ?? "");
  const [price, setPrice] = useState(item.price?.toString() ?? "");
  const [sizePrices, setSizePrices] = useState<Record<string, string>>(
    Object.fromEntries(item.item_sizes.map((s) => [s.id, s.price.toString()])),
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Escape closes the lightbox regardless of where focus landed inside it.
  useEffect(() => {
    if (!isPreviewOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsPreviewOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPreviewOpen]);

  function resetFields() {
    setNameEn(item.name_en);
    setNameAr(item.name_ar ?? "");
    setDescription(item.description ?? "");
    setPrice(item.price?.toString() ?? "");
    setSizePrices(Object.fromEntries(item.item_sizes.map((s) => [s.id, s.price.toString()])));
    setError(null);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateItemFields(item.id, {
        name_en: nameEn,
        name_ar: nameAr || null,
        description: description || null,
        price: hasSizes ? null : price === "" ? null : Number(price),
        sizePrices: hasSizes
          ? Object.entries(sizePrices).map(([id, p]) => ({ id, price: Number(p) }))
          : null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setIsEditing(false);
      router.refresh();
    });
  }

  // Every handler below calls router.refresh() on success. revalidatePath
  // inside the server action invalidates the server-side cache, but a
  // server action invoked directly from a button's onClick (not a native
  // <form action={...}> submit) doesn't reliably push fresh props back
  // into an already-mounted client component on its own. Without this,
  // `item` here stays frozen at whatever it was on page load, so a
  // second toggle computes !item.is_available against the STALE value
  // again instead of the value the first toggle actually set, which is
  // exactly the "toggled back to available, stayed unavailable" bug this
  // was caught from: both toggles were computing the same result from
  // the same stale starting point.
  function handleToggleAvailable() {
    startTransition(async () => {
      const result = await setAvailability(item.id, !item.is_available);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleTogglePopular() {
    startTransition(async () => {
      const result = await setPopular(item.id, !item.is_popular);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteItem(item.id);
      if (!result.ok) {
        setError(result.error);
        setIsConfirmingDelete(false);
        return;
      }
      router.refresh();
    });
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("photo", file);
    startTransition(async () => {
      const result = await replacePhoto(item.id, formData);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-(--radius-lg) border border-(--border-default) bg-(--bg-surface)">
      {/* Photo area: two distinct controls, not one control doing both
          jobs. Clicking the photo itself opens a full-size preview
          (the actual "see the existing image better" fix - it was a
          48px square before, impossible to judge a real product photo
          from). The camera badge, bottom-right, is the only upload
          affordance, always present so it also covers items with no
          photo yet. */}
      <div className="relative aspect-square w-full shrink-0 bg-(--bg-photo-panel)">
        {item.image_url ? (
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            aria-label={`View full-size photo of ${item.name_en}`}
            className="group absolute inset-0"
          >
            <Image
              src={item.image_url}
              alt={item.name_en}
              fill
              sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 45vw, 90vw"
              className="object-contain p-4"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition duration-(--duration-fast) group-hover:bg-black/25 group-hover:opacity-100">
              <MagnifyingGlassPlus size={24} weight="bold" className="text-white" />
            </span>
          </button>
        ) : (
          <div className="flex h-full items-center justify-center text-(length:--text-xs) text-white/80">
            No photo yet
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          {item.is_popular ? (
            <span className="rounded-(--radius-pill) bg-(--accent-solid) px-2 py-0.5 text-(length:--text-xs) font-semibold text-white">
              Popular
            </span>
          ) : (
            <span />
          )}
          {!item.is_available ? (
            <span className="rounded-(--radius-pill) bg-black/70 px-2 py-0.5 text-(length:--text-xs) font-semibold text-white">
              Sold out
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          aria-label={`Change photo for ${item.name_en}`}
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-(--radius-pill) bg-black/60 text-white transition duration-(--duration-fast) hover:bg-black/80 disabled:cursor-not-allowed"
        >
          <Camera size={15} weight="fill" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          disabled={isPending}
          className="sr-only"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div>
          <p className="truncate text-(length:--text-sm) font-medium text-(--text-primary)">{item.name_en}</p>
          <p className="text-(length:--text-xs) text-(--text-secondary)">
            {hasSizes
              ? item.item_sizes.map((s) => `${s.label} ${formatPrice(s.price)}`).join(" · ")
              : formatPrice(item.price ?? 0)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-(length:--text-xs) text-(--text-secondary)">
            <input
              type="checkbox"
              checked={item.is_available}
              onChange={handleToggleAvailable}
              disabled={isPending}
            />
            Available
          </label>
          <label className="flex items-center gap-1.5 text-(length:--text-xs) text-(--text-secondary)">
            <input type="checkbox" checked={item.is_popular} onChange={handleTogglePopular} disabled={isPending} />
            Popular
          </label>
        </div>

        <div className="mt-auto flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              resetFields();
              setIsEditing((v) => !v);
            }}
            className="flex-1 rounded-(--radius-pill) border border-(--border-default) px-3 py-1.5 text-(length:--text-xs) font-medium text-(--text-secondary) hover:bg-(--bg-surface-hover)"
          >
            {isEditing ? "Close" : "Edit"}
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            className="rounded-(--radius-pill) border border-(--border-default) px-3 py-1.5 text-(length:--text-xs) font-medium text-(--text-secondary) hover:bg-(--bg-surface-hover)"
          >
            Delete
          </button>
        </div>

        {isConfirmingDelete ? (
          <div className="flex flex-col gap-2 rounded-(--radius-md) bg-(--bg-unavailable) p-2.5 text-(length:--text-xs)">
            <span className="text-(--text-primary)">Delete &ldquo;{item.name_en}&rdquo;? This is permanent.</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 rounded-(--radius-pill) bg-(--accent-solid) px-3 py-1.5 font-semibold text-(--text-on-accent)"
              >
                Confirm delete
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="rounded-(--radius-pill) border border-(--border-default) px-3 py-1.5 font-medium text-(--text-secondary)"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {isEditing ? (
          <div className="flex flex-col gap-3 rounded-(--radius-md) border border-(--border-default) bg-(--bg-page) p-3">
            {error ? <p className="text-(length:--text-xs) text-(--accent-text)">{error}</p> : null}

            <label className="flex flex-col gap-1 text-(length:--text-xs) text-(--text-secondary)">
              Name (English)
              <input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) px-2 py-1.5 text-(length:--text-sm) text-(--text-primary)"
              />
            </label>
            <label className="flex flex-col gap-1 text-(length:--text-xs) text-(--text-secondary)">
              Name (Arabic)
              <input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                dir="rtl"
                className="rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) px-2 py-1.5 text-(length:--text-sm) text-(--text-primary)"
              />
            </label>
            <label className="flex flex-col gap-1 text-(length:--text-xs) text-(--text-secondary)">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) px-2 py-1.5 text-(length:--text-sm) text-(--text-primary)"
              />
            </label>

            {hasSizes ? (
              <div className="flex flex-col gap-2">
                <span className="text-(length:--text-xs) text-(--text-secondary)">
                  Sizes (label can&rsquo;t be changed here, only price)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {item.item_sizes.map((size) => (
                    <label
                      key={size.id}
                      className="flex flex-col gap-1 text-(length:--text-xs) text-(--text-secondary)"
                    >
                      {size.label}
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={sizePrices[size.id] ?? ""}
                        onChange={(e) => setSizePrices((prev) => ({ ...prev, [size.id]: e.target.value }))}
                        className="rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) px-2 py-1.5 text-(length:--text-sm) text-(--text-primary)"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <label className="flex flex-col gap-1 text-(length:--text-xs) text-(--text-secondary)">
                Price (EGP)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) px-2 py-1.5 text-(length:--text-sm) text-(--text-primary)"
                />
              </label>
            )}

            <p className="text-(length:--text-xs) text-(--text-muted)">
              To change the photo, click the camera badge on the photo above instead of here.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 rounded-(--radius-pill) bg-(--accent-solid) px-4 py-1.5 text-(length:--text-sm) font-semibold text-(--text-on-accent) disabled:opacity-60"
              >
                {isPending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetFields();
                  setIsEditing(false);
                }}
                className="rounded-(--radius-pill) border border-(--border-default) px-4 py-1.5 text-(length:--text-sm) font-medium text-(--text-secondary)"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {isPreviewOpen && item.image_url ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${item.name_en} photo`}
          onClick={() => setIsPreviewOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6"
        >
          <div className="relative max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              aria-label="Close preview"
              className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-(--radius-pill) bg-(--bg-surface) text-(--text-primary) shadow-lg"
            >
              <X size={18} weight="bold" />
            </button>
            {/* Plain img, not next/image: this modal sizes itself off the
                photo's own natural dimensions via max-h/max-w, which
                next/image can't do without a known width/height or a
                pre-sized fill container. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt={item.name_en}
              className="max-h-[85vh] max-w-[90vw] rounded-(--radius-lg) bg-(--bg-photo-panel) object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
