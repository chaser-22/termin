"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashNav({ items, className = "" }: { items: { href: string; label: string }[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={`flex gap-1 overflow-x-auto [scrollbar-width:none] -mx-1 px-1 ${className}`}>
      {items.map((item) => {
        const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
