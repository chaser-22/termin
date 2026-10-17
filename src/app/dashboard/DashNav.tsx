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
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-ink text-bg" : "text-muted hover:text-ink hover:bg-surface-2"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
