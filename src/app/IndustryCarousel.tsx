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
        className="swipe-track flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((c, i) => (
          <div key={c.slug} role="listitem" className="swipe-item shrink-0 snap-center" data-accent={c.slug}>
            <Link
              href={c.href}
              onClick={onCardClick(i)}
              onFocus={() => goTo(i)}
              aria-current={i === active ? "true" : undefined}
              className="swipe-card group relative flex h-full flex-col overflow-hidden rounded-[34px] border p-5 sm:p-6 outline-none"
            >
              {/* A soft wash of the industry colour at the top of the card */}
              <span aria-hidden className="swipe-wash" />
              <span className="relative flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <span className="grid place-items-center size-12 rounded-[18px] bg-accent text-accent-ink shadow-[0_10px_24px_-10px_var(--accent)]">
                    <VerticalIcon icon={c.icon} className="size-[22px]" strokeWidth={1.8} />
                  </span>
                  <span className="text-[18px] sm:text-[19px] font-semibold leading-tight tracking-[-0.015em]">{c.title}</span>
                </span>
                {c.preview && <span className="rounded-full border border-[var(--glass-border)] bg-glass px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">{labels.example}</span>}
              </span>

              {c.preview ? (
                <span className="swipe-preview relative mt-4 sm:mt-5 block flex-1 rounded-[26px] border border-line/60 bg-bg/75 p-4 sm:p-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]">
                  <span className="flex items-center gap-3.5">
                    <span className="grid place-items-center size-12 rounded-full bg-accent text-accent-ink display text-[22px] ring-4 ring-[color-mix(in_srgb,var(--accent)_18%,transparent)]">{c.preview.initial}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[17px] tracking-[-0.01em]">{c.preview.name}</span>
                      <span className="block truncate text-[12.5px] text-muted">{c.preview.typeLabel}</span>
                    </span>
                  </span>
                  <span className="mt-4 block space-y-2">
                    {c.preview.items.map((it, n) => (
                      // Phones show three services so the whole card fits the first screen
                      <span key={it.name} className={`${n === 3 ? "hidden sm:flex" : "flex"} items-center justify-between gap-3 rounded-2xl border border-line/50 bg-surface/70 px-3.5 py-2 text-[14px]`}>
                        <span className="min-w-0">
                          <span className="block truncate font-medium leading-snug">{it.name}</span>
                          <span className="mt-0.5 flex items-center gap-1 text-[12px] text-muted tabular-nums">
                            {it.left !== undefined ? <Users className="size-3" /> : <Clock className="size-3" />}
                            {it.left !== undefined ? `${it.meta} · ${it.left} ${labels.placesLeft}` : it.meta}
                          </span>
                        </span>
                        {it.price && <span className="shrink-0 text-[14.5px] font-semibold tabular-nums">{it.price}</span>}
                      </span>
                    ))}
                  </span>
                  <span className="mt-4 flex items-center justify-between rounded-full bg-[var(--pill-bg)] text-[var(--pill-fg)] py-2 pl-5 pr-2">
                    <span className="min-w-0 leading-tight">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">{labels.nextFree}</span>
                      <span className="block truncate text-[12.5px] opacity-90">{c.preview.nextFree.day}</span>
                    </span>
                    <span className="display text-[26px] text-[var(--pill-time)] tabular-nums px-2">{c.preview.nextFree.time}</span>
                  </span>
                </span>
              ) : (
                <span className="relative mt-5 flex flex-1 items-center rounded-[26px] border border-dashed border-line p-5 text-[16px] leading-relaxed text-muted">{c.line}</span>
              )}

              <span className="relative mt-4 sm:mt-5 flex h-13 items-center justify-center gap-2 rounded-full bg-accent text-[15px] font-semibold text-accent-ink shadow-[0_14px_30px_-14px_var(--accent)] transition-transform duration-300 group-active:scale-[0.98]">
                {labels.open} <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
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
