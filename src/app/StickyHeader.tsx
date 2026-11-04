"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Desktop: the header stays at the top on a slightly lighter, mostly opaque
// bar (a little blur shows through), with a thin line under it once the page
// moves. Phones and tablets keep a plain header.
export function StickyHeader({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;
    const onScroll = () => bar.toggleAttribute("data-scrolled", window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={ref}
      className="relative z-40 w-full border-b border-transparent transition-[border-color] duration-300 lg:sticky lg:top-0 lg:bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] lg:backdrop-blur-xl lg:backdrop-saturate-150 lg:data-[scrolled]:border-line"
      style={{ viewTransitionName: "app-header" }}
    >
      {children}
    </header>
  );
}
