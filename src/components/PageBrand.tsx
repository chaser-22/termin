"use client";

import { brandCss } from "@/lib/brand";

/**
 * Gives a whole page its brand colour. Next.js keeps pages you left hidden in the
 * background, so a rule is only active while its page is on screen. Otherwise that
 * colour leaks into whichever page is showing.
 *
 * The rule is switched on and off from the ref, which React only attaches while the
 * page is visible. One created in the browser starts off, because a hidden page can be
 * rebuilt (after logging out, say) and that ref never runs. The first page from the
 * server starts on, so it never flashes the wrong colour while it loads.
 */
export function PageBrand({ brand }: { brand: string | null | undefined }) {
  return (
    <style
      media={typeof document === "undefined" ? undefined : "not all"}
      suppressHydrationWarning
      ref={(style) => {
        if (style) style.media = "";
        return () => {
          if (style) style.media = "not all";
        };
      }}
    >
      {brandCss(brand)}
    </style>
  );
}
