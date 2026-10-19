"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import { VerticalIcon } from "@/components/VerticalIcon";
import type { Vertical } from "@/lib/verticals";

export type CarouselCard = {
  slug: string;
  href: string;
  icon: Vertical["icon"] | "more";
  title: string;
  line: string;
  /** A small example booking page; absent for "other businesses" */
  preview?: {
    initial: string;
    name: string;
    typeLabel: string;
    items: { name: string; meta: string; price?: string; left?: number }[];
    nextFree: { day: string; time: string };
  };
};

type Labels = { example: string; nextFree: string; open: string; prev: string; next: string; swipeHint: string; placesLeft: string };

// Industries as a native swipe carousel (CSS scroll snap). The centred card is
// full size; neighbours shrink and fade with their distance from the centre,
// updated once per frame from scroll position only. Dots, arrows and arrow keys
// jump directly, so nobody has to swipe to find their business.
export function IndustryCarousel({ cards, labels }: { cards: CarouselCard[]; labels: Labels }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const centerOf = (el: HTMLElement) => el.offsetLeft + el.offsetWidth / 2;

  const goTo = useCallback((i: number) => {
    const t = track.current;
    const el = t?.children[i] as HTMLElement | undefined;
    if (!t || !el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollTo({ left: centerOf(el) - t.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
  }, []);

  useEffect(() => {
    const t = track.current;
    if (!t) return;
    const items = Array.from(t.children) as HTMLElement[];
    let frame = 0;
    const update = () => {
      frame = 0;
      const mid = t.scrollLeft + t.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      items.forEach((el, i) => {
        const offset = (centerOf(el) - mid) / el.offsetWidth;
        const dist = Math.abs(offset);
        el.style.setProperty("--p", Math.min(1, dist).toFixed(3));
        el.style.setProperty("--dir", Math.max(-1, Math.min(1, offset)).toFixed(3));
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    t.addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      t.removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, []);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(Math.min(cards.length - 1, active + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(Math.max(0, active - 1));
    }
  };
  // A card off to the side comes to the centre first; the centred one opens
  const onCardClick = (i: number) => (e: MouseEvent) => {
    if (i !== active) {
      e.preventDefault();
      goTo(i);
    }
  };

  return (
    <div className="relative" onKeyDown={onKey}>
      <div
        ref={track}
        role="list"
        aria-roledescription="carousel"
        className="swipe-track flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((c, i) => (
          <div key={c.slug} role="listitem" className="swipe-item shrink-0 snap-center" data-accent={c.slug}>
            <Link
              href={c.href}
              onClick={onCardClick(i)}
              onFocus={() => goTo(i)}
              aria-current={i === active ? "true" : undefined}
              className="swipe-card group block h-full rounded-[30px] border border-[var(--glass-border)] bg-glass backdrop-blur-xl p-5 outline-none"
            >
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-2.5">
                  <span className="grid place-items-center size-10 rounded-2xl bg-accent-soft text-accent">
                    <VerticalIcon icon={c.icon} className="size-[18px]" strokeWidth={1.8} />
                  </span>
                  <span className="font-semibold leading-tight">{c.title}</span>
                </span>
                {c.preview && <span className="rounded-full border border-line px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">{labels.example}</span>}
              </span>

              {c.preview ? (
                <span className="swipe-preview mt-5 block rounded-[22px] bg-bg/70 border border-line/60 p-4">
                  <span className="flex items-center gap-3">
                    <span className="grid place-items-center size-10 rounded-full bg-accent text-accent-ink display text-lg">{c.preview.initial}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[15px]">{c.preview.name}</span>
                      <span className="block truncate text-[12px] text-muted">{c.preview.typeLabel}</span>
                    </span>
                  </span>
                  <span className="mt-4 block space-y-1.5">
                    {c.preview.items.map((it) => (
                      <span key={it.name} className="flex items-center justify-between gap-3 rounded-xl bg-surface/60 px-3 py-2 text-[13px]">
                        <span className="truncate font-medium">{it.name}</span>
                        <span className="flex shrink-0 items-center gap-2 text-muted tabular-nums">
                          {it.left !== undefined ? (
                            <>
                              <Users className="size-3.5" /> {it.left} {labels.placesLeft}
                            </>
                          ) : (
                            <>
                              <Clock className="size-3.5" /> {it.meta}
                              {it.price && <span className="font-semibold text-ink">{it.price}</span>}
                            </>
                          )}
                        </span>
                      </span>
                    ))}
                  </span>
                  <span className="mt-3 flex items-center justify-between rounded-full bg-[var(--pill-bg)] text-[var(--pill-fg)] py-1.5 pl-4 pr-1.5">
                    <span className="min-w-0 leading-tight">
                      <span className="block text-[9.5px] font-bold uppercase tracking-[0.14em] opacity-80">{labels.nextFree}</span>
                      <span className="block truncate text-[11.5px] opacity-90">{c.preview.nextFree.day}</span>
                    </span>
                    <span className="display text-[20px] text-[var(--pill-time)] tabular-nums px-2">{c.preview.nextFree.time}</span>
                  </span>
                </span>
              ) : (
                <span className="mt-5 block text-[15px] text-muted">{c.line}</span>
              )}

              <span className="mt-5 flex items-center justify-between text-[14px] font-semibold">
                <span>{labels.open}</span>
                <span className="grid place-items-center size-9 rounded-full bg-accent text-accent-ink transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight className="size-4" />
                </span>
              </span>
            </Link>
          </div>
        ))}
      </div>

      {/* Position and direct jumps */}
      <div className="mt-1 flex items-center justify-center gap-3">
        <button type="button" onClick={() => goTo(Math.max(0, active - 1))} disabled={active === 0} aria-label={labels.prev} className="hidden sm:grid place-items-center size-10 rounded-full border border-line text-muted hover:text-ink hover:bg-glass disabled:opacity-30 transition cursor-pointer">
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex items-center gap-1.5">
          {cards.map((c, i) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => goTo(i)}
              aria-label={c.title}
              aria-current={i === active ? "true" : undefined}
              className="grid place-items-center size-6 cursor-pointer"
            >
              <span className={`block h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-5 bg-accent" : "w-1.5 bg-muted/40"}`} />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => goTo(Math.min(cards.length - 1, active + 1))} disabled={active === cards.length - 1} aria-label={labels.next} className="hidden sm:grid place-items-center size-10 rounded-full border border-line text-muted hover:text-ink hover:bg-glass disabled:opacity-30 transition cursor-pointer">
          <ChevronRight className="size-5" />
        </button>
      </div>
      <p className="mt-1 text-center text-[12.5px] text-muted sm:hidden">{labels.swipeHint}</p>
    </div>
  );
}
