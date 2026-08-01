"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/stats", label: "Stats" },
  { href: "/admin/orders", label: "Orders" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-(--border-default) px-4">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-3 py-2.5 text-(length:--text-sm) font-medium transition duration-(--duration-fast) ${
              isActive
                ? "border-(--accent-solid) text-(--accent-text)"
                : "border-transparent text-(--text-secondary) hover:text-(--text-primary)"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
