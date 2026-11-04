"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Section = { id: string; label: string };

// Grows or collapses sideways; hidden parts can't be tabbed to while collapsed
const collapses = "lg:grid lg:grid-cols-[1fr] lg:transition-[grid-template-columns,opacity,visibility] lg:duration-300 lg:ease-[cubic-bezier(0.22,1,0.36,1)] lg:group-data-[compact]/pill:grid-cols-[0fr] lg:group-data-[compact]/pill:invisible lg:group-data-[compact]/pill:opacity-0";

// Desktop: a floating pill with everything in it at the top of the page. Scrolling
// down shrinks it to the logo, the section you're in and the sign-up button;
// scrolling up opens it again, so sign in and language are never far away.
// Phones and tablets keep a plain header.
export function PillHeader({ brand, sections, controls, cta }: { brand: ReactNode; sections: Section[]; controls: ReactNode; cta: ReactNode }) {
  const [compact, setCompact] = useState(false);
  const [current, setCurrent] = useState(0);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80) setCompact(false);
      else if (y > lastY.current + 6) setCompact(true);
      else if (y < lastY.current - 6) setCompact(false);
      if (Math.abs(y - lastY.current) > 6 || y < 80) lastY.current = y;

      let at = 0;
      sections.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 140) at = i;
      });
      setCurrent(at);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  return (
    <header className="relative z-40 w-full lg:pointer-events-none lg:sticky lg:top-0 lg:px-5 lg:pt-3" style={{ viewTransitionName: "app-header" }}>
      <div
        data-compact={compact ? "" : undefined}
        className="group/pill mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2 lg:pointer-events-auto lg:h-14 lg:max-w-[1112px] lg:rounded-full lg:border lg:border-line lg:bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] lg:py-0 lg:pl-6 lg:pr-2 lg:shadow-soft lg:backdrop-blur-xl lg:backdrop-saturate-150 lg:transition-[max-width] lg:duration-500 lg:ease-[cubic-bezier(0.22,1,0.36,1)] lg:data-[compact]:max-w-[480px]"
      >
        {brand}

        <nav aria-label={sections[0]?.label} className={`hidden ${collapses}`}>
          <span className="flex min-w-0 items-center gap-0.5 overflow-hidden whitespace-nowrap">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="btn-ghost btn-sm px-2 xl:px-3">
                {s.label}
              </a>
            ))}
          </span>
        </nav>

        {/* The section you're in, only in the small pill */}
        <span className="hidden lg:grid lg:grid-cols-[0fr] lg:invisible lg:opacity-0 lg:transition-[grid-template-columns,opacity,visibility] lg:duration-300 lg:group-data-[compact]/pill:grid-cols-[1fr] lg:group-data-[compact]/pill:visible lg:group-data-[compact]/pill:opacity-100">
          <span className="min-w-0 overflow-hidden whitespace-nowrap text-center text-[14px] text-muted">{sections[current]?.label}</span>
        </span>

        <div className="flex items-center gap-1 sm:gap-2 lg:gap-0">
          <div className={collapses}>
            <div className="flex min-w-0 items-center gap-1 sm:gap-2 lg:-my-2 lg:gap-2.5 lg:overflow-hidden lg:py-2 lg:pr-2.5">{controls}</div>
          </div>
          {cta}
        </div>
      </div>
    </header>
  );
}
