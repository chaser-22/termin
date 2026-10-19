"use client";

import { useEffect, useRef, type ReactNode } from "react";

// One soft light that follows the cursor across the whole industry grid. Each
// card gets the light position in its own coordinates (--mx/--my), so the glow
// flows from card to card instead of switching on and off. Card rects are
// measured when the pointer enters (and on scroll/resize), so each frame is
// just arithmetic. Mouse only; off with reduced motion.
export function SpotlightGrid({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = ref.current;
    if (!grid) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = Array.from(grid.querySelectorAll<HTMLElement>(".industry-card"));
    let rects: DOMRect[] = [];
    let box = grid.getBoundingClientRect();
    let frame = 0;
    let x = 0;
    let y = 0;

    const measure = () => {
      box = grid.getBoundingClientRect();
      rects = cards.map((c) => c.getBoundingClientRect());
    };
    const apply = () => {
      frame = 0;
      grid.style.setProperty("--gx", `${(x - box.left).toFixed(0)}px`);
      grid.style.setProperty("--gy", `${(y - box.top).toFixed(0)}px`);
      cards.forEach((c, i) => {
        const r = rects[i];
        c.style.setProperty("--mx", `${(x - r.left).toFixed(0)}px`);
        c.style.setProperty("--my", `${(y - r.top).toFixed(0)}px`);
      });
    };
    const enter = (e: PointerEvent) => {
      measure();
      x = e.clientX;
      y = e.clientY;
      apply();
      grid.dataset.lit = "";
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const leave = () => {
      delete grid.dataset.lit;
    };
    const remeasure = () => {
      if (grid.dataset.lit !== undefined) measure();
    };

    grid.addEventListener("pointerenter", enter);
    grid.addEventListener("pointermove", move, { passive: true });
    grid.addEventListener("pointerleave", leave);
    addEventListener("scroll", remeasure, { passive: true });
    addEventListener("resize", remeasure);
    return () => {
      cancelAnimationFrame(frame);
      grid.removeEventListener("pointerenter", enter);
      grid.removeEventListener("pointermove", move);
      grid.removeEventListener("pointerleave", leave);
      removeEventListener("scroll", remeasure);
      removeEventListener("resize", remeasure);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
