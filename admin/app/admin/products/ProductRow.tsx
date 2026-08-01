"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera } from "@phosphor-icons/react";
import type { MenuItemRow } from "@/lib/menu/types";
import { formatPrice } from "@/lib/menu/format";
import { updateItemFields, setAvailability, setPopular, deleteItem, replacePhoto } from "./actions";

/**
 * One item's row plus its expand-in-place edit form and delete-confirm
 * step. Not a modal: with 134 items, an inline expand keeps the rest of
 * the list in view instead of stacking dialogs on a dense admin list.
 */
export function ProductRow({ item }: { item: MenuItemRow }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
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
    <div className="border-b border-(--border-default) last:border-b-0">
      <div className="flex items-center gap-3 py-2.5">
        {/* The thumbnail itself is the photo control, not a field buried
            inside Edit: click it, a file picker opens, upload replaces
            it immediately. This was the actual fix for "why can't I
            change images" as much as the underlying upload pipeline
            was (that part already worked, verified end to end against
            the real database); a native file input two clicks deep in
            an edit form is easy to never notice. Sibling button + input
            (input visually hidden, triggered via the ref), not an
            input nested inside the button: same reasoning as every
            other sibling-interactive-element pattern in this codebase,
            a button can't correctly contain another native control. */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-(--radius-md) bg-(--bg-photo-panel)">
          {item.image_url ? (
            <Image src={item.image_url} alt={item.name_en} fill sizes="48px" className="object-contain" />
          ) : null}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            aria-label={`Change photo for ${item.name_en}`}
            className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-(--duration-fast) hover:bg-black/40 disabled:cursor-not-allowed"
          >
            {/* Always faintly visible, not hover-only: hover alone isn't
                discoverable on touch devices, and this was reported as
                "I can't find how to do this," not just "it's subtle." */}
            <span className="flex h-5 w-5 items-center justify-center rounded-(--radius-pill) bg-black/50 text-white">
              <Camera size={12} weight="fill" />
            </span>
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

        <div className="min-w-0 flex-1">
          <p className="truncate text-(length:--text-sm) font-medium text-(--text-primary)">{item.name_en}</p>
          <p className="text-(length:--text-xs) text-(--text-muted)">
            {hasSizes
              ? item.item_sizes.map((s) => `${s.label} ${formatPrice(s.price)}`).join(" · ")
              : formatPrice(item.price ?? 0)}
          </p>
        </div>

        <label className="flex items-center gap-1.5 text-(length:--text-xs) text-(--text-secondary)">
          <input type="checkbox" checked={item.is_available} onChange={handleToggleAvailable} disabled={isPending} />
          Available
        </label>
        <label className="flex items-center gap-1.5 text-(length:--text-xs) text-(--text-secondary)">
          <input type="checkbox" checked={item.is_popular} onChange={handleTogglePopular} disabled={isPending} />
          Popular
        </label>

        <button
          type="button"
          onClick={() => {
            resetFields();
            setIsEditing((v) => !v);
          }}
          className="rounded-(--radius-pill) border border-(--border-default) px-3 py-1.5 text-(length:--text-xs) font-medium text-(--text-secondary) hover:bg-(--bg-surface-hover)"
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
        <div className="mb-3 flex items-center gap-3 rounded-(--radius-md) bg-(--bg-unavailable) px-3 py-2 text-(length:--text-sm)">
          <span className="flex-1 text-(--text-primary)">
            Delete &ldquo;{item.name_en}&rdquo;? This is permanent.
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-(--radius-pill) bg-(--accent-solid) px-3 py-1.5 text-(length:--text-xs) font-semibold text-(--text-on-accent)"
          >
            Confirm delete
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(false)}
            className="rounded-(--radius-pill) border border-(--border-default) px-3 py-1.5 text-(length:--text-xs) font-medium text-(--text-secondary)"
          >
            Cancel
          </button>
        </div>
      ) : null}

      {isEditing ? (
        <div className="mb-4 flex flex-col gap-3 rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) p-4">
          {error ? <p className="text-(length:--text-xs) text-(--accent-text)">{error}</p> : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-(length:--text-xs) text-(--text-secondary)">
              Name (English)
              <input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="rounded-(--radius-md) border border-(--border-default) bg-(--bg-page) px-2 py-1.5 text-(length:--text-sm) text-(--text-primary)"
              />
            </label>
            <label className="flex flex-col gap-1 text-(length:--text-xs) text-(--text-secondary)">
              Name (Arabic)
              <input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                dir="rtl"
                className="rounded-(--radius-md) border border-(--border-default) bg-(--bg-page) px-2 py-1.5 text-(length:--text-sm) text-(--text-primary)"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-(length:--text-xs) text-(--text-secondary)">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-(--radius-md) border border-(--border-default) bg-(--bg-page) px-2 py-1.5 text-(length:--text-sm) text-(--text-primary)"
            />
          </label>

          {hasSizes ? (
            <div className="flex flex-col gap-2">
              <span className="text-(length:--text-xs) text-(--text-secondary)">
                Sizes (label can&rsquo;t be changed here, only price)
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {item.item_sizes.map((size) => (
                  <label key={size.id} className="flex flex-col gap-1 text-(length:--text-xs) text-(--text-secondary)">
                    {size.label}
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={sizePrices[size.id] ?? ""}
                      onChange={(e) => setSizePrices((prev) => ({ ...prev, [size.id]: e.target.value }))}
                      className="rounded-(--radius-md) border border-(--border-default) bg-(--bg-page) px-2 py-1.5 text-(length:--text-sm) text-(--text-primary)"
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <label className="flex max-w-40 flex-col gap-1 text-(length:--text-xs) text-(--text-secondary)">
              Price (EGP)
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="rounded-(--radius-md) border border-(--border-default) bg-(--bg-page) px-2 py-1.5 text-(length:--text-sm) text-(--text-primary)"
              />
            </label>
          )}

          <p className="text-(length:--text-xs) text-(--text-muted)">
            To change the photo, click the thumbnail in the row above instead of here.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-(--radius-pill) bg-(--accent-solid) px-4 py-1.5 text-(length:--text-sm) font-semibold text-(--text-on-accent) disabled:opacity-60"
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
  );
}
