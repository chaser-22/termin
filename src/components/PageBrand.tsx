"use client";

import { brandCss } from "@/lib/brand";

/**
 * Gives a whole page its brand colour. Next.js keeps pages you left hidden in the
 * background, so the rule switches itself off while its page is hidden. Otherwise
 * that colour leaks into whichever page is on screen.
 */
export function PageBrand({ brand }: { brand: string | null | undefined }) {
  return (
    <style
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
