"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createItem } from "./actions";

/**
 * Flat price only, see createItem's own comment in actions.ts for why
 * sized items aren't created here this session.
 */
export function NewItemForm({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isPopular, setIsPopular] = useState(false);

  function reset() {
    setNameEn("");
    setNameAr("");
    setDescription("");
    setPrice("");
    setIsPopular(false);
    setError(null);
  }

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createItem({
        category_id: categoryId,
        name_en: nameEn,
        name_ar: nameAr || null,
        description: description || null,
        price: Number(price),
        is_popular: isPopular,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      reset();
      setIsOpen(false);
      router.refresh();
    });
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-2 rounded-(--radius-pill) border border-dashed border-(--border-strong) px-3 py-1.5 text-(length:--text-xs) font-medium text-(--text-secondary) hover:bg-(--bg-surface-hover)"
      >
        + Add item
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-3 rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) p-4">
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

      <div className="flex items-end gap-4">
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
        <label className="flex items-center gap-1.5 pb-2 text-(length:--text-xs) text-(--text-secondary)">
          <input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} />
          Popular
        </label>
      </div>

      <p className="text-(length:--text-xs) text-(--text-muted)">
        Photo can be added after creating, from the item&rsquo;s own Edit panel.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={isPending}
          className="rounded-(--radius-pill) bg-(--accent-solid) px-4 py-1.5 text-(length:--text-sm) font-semibold text-(--text-on-accent) disabled:opacity-60"
        >
          {isPending ? "Creating…" : "Create item"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setIsOpen(false);
          }}
          className="rounded-(--radius-pill) border border-(--border-default) px-4 py-1.5 text-(length:--text-sm) font-medium text-(--text-secondary)"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
