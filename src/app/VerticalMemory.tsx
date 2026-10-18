"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const KEY = "termin:vertical";

/** Remembers which business-type page this visitor looked at. */
export function RememberVertical({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(KEY, slug);
    } catch {}
  }, [slug]);
  return null;
}

/** "Continue: Dentists →" on the homepage for someone who has been here before. */
export function ContinueChip({ label, titles }: { label: string; titles: Record<string, string> }) {
  const slug = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(KEY);
      } catch {
        return null;
      }
    },
    () => null,
  );
  if (!slug || !titles[slug]) return null;
  return (
    <Link href={`/za/${slug}`} className="btn-secondary btn-sm animate-pop-in">
      {label}: {titles[slug]} <ArrowRight className="size-3.5" />
    </Link>
  );
}
