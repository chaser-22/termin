"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Desktop: the header stays at the top while you scroll and gets a glass
// background once the page moves. Phones and tablets keep a plain header.
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
      className="relative z-40 w-full border-b border-transparent transition-[background-color,border-color] duration-300 lg:sticky lg:top-0 lg:data-[scrolled]:glass-bar"
      style={{ viewTransitionName: "app-header" }}
    >
      {children}
    </header>
  );
}
