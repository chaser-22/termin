"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { BusinessType } from "@/lib/slug";

/** Key the setup form reads to pre-select the business type picked on the homepage. */
export const SETUP_TYPE_KEY = "termin:setup-type";

/** "Start" link that remembers which kind of business the visitor picked. */
export function StartLink({ type, className, children }: { type: BusinessType; className?: string; children: ReactNode }) {
  return (
    <Link
      href={`/start?type=${type}`}
      className={className}
      onClick={() => {
        try {
          localStorage.setItem(SETUP_TYPE_KEY, type);
        } catch {}
      }}
    >
      {children}
    </Link>
  );
}
