"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Tilts the industry card under the cursor toward it and moves its light and shadow.
// One listener for the whole grid, at most one update per frame; CSS does
// the rest. Skipped on touch screens and with reduced motion.
const MAX_X = 4; // degrees, up/down
const MAX_Y = 5; // degrees, left/right

export function TiltGrid({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = ref.current;
    if (!grid) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let card: HTMLElement | null = null;
    let frame = 0;
    let x = 0;
    let y = 0;

    const settle = (el: HTMLElement | null) => {
      if (!el) return;
      delete el.dataset.tilt;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    const apply = () => {
      frame = 0;
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (x - r.left) / r.width));
      const py = Math.min(1, Math.max(0, (y - r.top) / r.height));
      card.dataset.tilt = "";
      card.style.setProperty("--rx", `${((0.5 - py) * 2 * MAX_X).toFixed(2)}deg`);
      card.style.setProperty("--ry", `${((px - 0.5) * 2 * MAX_Y).toFixed(2)}deg`);
      card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      // Light comes from the cursor, so the shadow falls the other way
      card.style.setProperty("--sx", `${((0.5 - px) * 16).toFixed(1)}px`);
      card.style.setProperty("--sy", `${((0.5 - py) * 10).toFixed(1)}px`);
    };
    const move = (e: PointerEvent) => {
      const over = (e.target as HTMLElement).closest<HTMLElement>(".industry-card");
      if (over !== card) {
        settle(card);
        card = over;
      }
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const leave = () => {
      settle(card);
      card = null;
    };

    grid.addEventListener("pointermove", move, { passive: true });
    grid.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      grid.removeEventListener("pointermove", move);
      grid.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
