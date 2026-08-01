"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import type { MenuItemRow } from "@/lib/menu/types";
import { formatPrice } from "@/lib/menu/format";
import { updateItemFields, setAvailability, setPopular, deleteItem, replacePhoto } from "./actions";

/**
 * One item's row plus its expand-in-place edit form and delete-confirm
 * step. Not a modal: with 134 items, an inline expand keeps the rest of
 * the list in view instead of stacking dialogs on a dense admin list.
 */
export function ProductRow({ item }: { item: MenuItemRow }) {
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
    });
  }

  function handleToggleAvailable() {
    startTransition(async () => {
      const result = await setAvailability(item.id, !item.is_available);
      if (!result.ok) setError(result.error);
    });
  }

  function handleTogglePopular() {
    startTransition(async () => {
      const result = await setPopular(item.id, !item.is_popular);
      if (!result.ok) setError(result.error);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteItem(item.id);
      if (!result.ok) {
        setError(result.error);
        setIsConfirmingDelete(false);
      }
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
      if (!result.ok) setError(result.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  return (
    <div className="border-b border-(--border-default) last:border-b-0">
      <div className="flex items-center gap-3 py-2.5">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-(--radius-md) bg-(--bg-photo-panel)">
          {item.image_url ? (
            <Image src={item.image_url} alt={item.name_en} fill sizes="48px" className="object-contain" />
          ) : null}
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

          <label className="flex flex-col gap-1 text-(length:--text-xs) text-(--text-secondary)">
            Replace photo
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} disabled={isPending} />
          </label>

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
