"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Desktop: the header stays at the top while you scroll. It gets a glass
// background once the page moves, and shows its "Start free" button only after
// the big one in the hero (id = watch) has scrolled away, so the two never
// sit on screen together. Phones and tablets keep a plain header.
export function StickyHeader({ watch, children }: { watch: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;
    const onScroll = () => bar.toggleAttribute("data-scrolled", window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const target = document.getElementById(watch);
    const io = new IntersectionObserver(
      ([e]) => bar.toggleAttribute("data-cta", !e.isIntersecting && e.boundingClientRect.top < 0),
      { rootMargin: `-${bar.offsetHeight}px 0px 0px 0px` },
    );
    if (target) io.observe(target);
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, [watch]);

  return (
    <header
      ref={ref}
      className="group/bar relative z-40 w-full border-b border-transparent transition-[background-color,border-color] duration-300 lg:sticky lg:top-0 lg:data-[scrolled]:glass-bar"
      style={{ viewTransitionName: "app-header" }}
    >
      {children}
    </header>
  );
}
