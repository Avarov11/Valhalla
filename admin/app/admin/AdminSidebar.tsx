"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartBar, Package, ShoppingBag } from "@phosphor-icons/react";
import logoMark from "@/logo.png";

const NAV_ITEMS = [
  { href: "/admin/products", label: "Products", sublabel: "Menu items & pricing", icon: Package },
  { href: "/admin/stats", label: "Stats", sublabel: "Overview & catalog health", icon: ChartBar },
  { href: "/admin/orders", label: "Orders", sublabel: "Customer orders", icon: ShoppingBag },
];

/**
 * Desktop-only (lg+, hidden below it, see AdminNav.tsx for the mobile/
 * tablet equivalent), same "sidebar at lg+, compact nav below it" split
 * the customer site already uses for its own category navigation
 * (CategorySidebar/CategoryRail/BottomBar, see CLAUDE.md, Design). Not
 * a copy of any reference's colors, brand mark and accent are
 * Valhalla's own; only the pattern (vertical nav, icon + label +
 * sublabel, rounded active state) carries over.
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-(--border-default) bg-(--bg-surface) lg:flex">
      <div className="flex items-center gap-2 border-b border-(--border-default) px-5 py-5">
        <Image src={logoMark} alt="" className="h-7 w-auto [filter:var(--logo-invert)]" />
        <span className="rounded-(--radius-pill) bg-(--accent-subtle-bg) px-2 py-0.5 text-(length:--text-xs) font-semibold uppercase tracking-(--tracking-wide) text-(--accent-text)">
          Admin
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <span className="px-2 pb-1 text-(length:--text-xs) font-medium uppercase tracking-(--tracking-wide) text-(--text-muted)">
          Menu
        </span>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              // See AdminNav.tsx's own comment: forces the full prefetch
              // (data included), not just the shell.
              prefetch={true}
              className={`flex items-start gap-3 rounded-(--radius-md) px-3 py-2.5 transition duration-(--duration-fast) ${
                isActive
                  ? "bg-(--accent-subtle-bg) text-(--accent-text)"
                  : "text-(--text-secondary) hover:bg-(--bg-surface-hover) hover:text-(--text-primary)"
              }`}
            >
              <Icon size={20} weight={isActive ? "fill" : "regular"} className="mt-0.5 shrink-0" />
              <span className="flex flex-col">
                <span className="text-(length:--text-sm) font-medium">{item.label}</span>
                <span className="text-(length:--text-xs) text-(--text-muted)">{item.sublabel}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-(--border-default) px-5 py-4">
        <p className="text-(length:--text-xs) text-(--text-muted)">No login yet, local only.</p>
      </div>
    </aside>
  );
}
