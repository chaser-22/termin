"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Desktop: the header stays at the top on a solid background, with a thin
// line under it once the page moves. Phones and tablets keep a plain header.
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
      className="relative z-40 w-full border-b border-transparent transition-[border-color] duration-300 lg:sticky lg:top-0 lg:bg-bg lg:data-[scrolled]:border-line"
      style={{ viewTransitionName: "app-header" }}
    >
      {children}
    </header>
  );
}
