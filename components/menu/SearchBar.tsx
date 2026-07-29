"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <MagnifyingGlass
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)"
      />
      <input
        id="menu-search-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search the menu"
        aria-label="Search the menu"
        className="min-h-11 w-full rounded-(--radius-md) border border-(--border-default) bg-(--bg-surface) py-2 pl-10 pr-11 text-(length:--text-sm) text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--accent-solid)"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-(--radius-md) text-(--text-muted) transition duration-(--duration-fast) hover:bg-(--bg-surface-hover) active:scale-90"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}
