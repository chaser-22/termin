"use client";

import { useEffect, useRef } from "react";

// The homepage environment: contour rings at two depths, slow drifting light,
// and a soft pool of light that eases after the cursor. The pointer only moves
// two numbers (--px/--py, -1..1); CSS turns them into parallax and the light
// position. The easing loop runs only while the light is catching up.
// Touch screens and reduced motion get the same picture, standing still.
export function Atmosphere() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.dataset.live = "";

    let tx = 0;
    let ty = -0.4;
    let x = tx;
    let y = ty;
    let frame = 0;

    const step = () => {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      el.style.setProperty("--px", x.toFixed(4));
      el.style.setProperty("--py", y.toFixed(4));
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(step) : 0;
    };
    const move = (e: PointerEvent) => {
      tx = (e.clientX / innerWidth) * 2 - 1;
      ty = (e.clientY / innerHeight) * 2 - 1;
      if (!frame) frame = requestAnimationFrame(step);
    };

    addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="atmo">
      <div className="atmo-glow" />
      <div className="atmo-rings atmo-rings-far" />
      <div className="atmo-rings atmo-rings-near" />
      <div className="atmo-light" />
    </div>
  );
}
