"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

// A small floating "there's more below" pill. It shows up a moment after the
// page opens and goes away for good once the visitor scrolls or the section
// it points to is already on screen.
export function ScrollCue({ label, target }: { label: string; target: string }) {
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = document.getElementById(target);
    const finish = () => setDone(true);
    const onScroll = () => {
      if (window.scrollY > 80) finish();
    };
    onScroll();
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) finish();
    });
    if (el) io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    const timer = setTimeout(() => setShown(true), 1200);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, [target]);

  const visible = shown && !done;

  return (
    <div
      className={`fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-30 flex justify-center transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3"
      }`}
    >
      <button
        type="button"
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        onClick={() => {
          const smooth = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
          document.getElementById(target)?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
        }}
        className="btn-secondary btn-sm shadow-lift"
      >
        {label}
        <ChevronDown className="size-4 text-accent motion-safe:animate-bounce" strokeWidth={2.5} />
      </button>
    </div>
  );
}
