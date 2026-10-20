"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowRight, Bell, Check, ChevronLeft, ChevronRight, Clock, Link2, Users } from "lucide-react";
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
    arrive: { kind: "qr" | "instagram" | "chat"; caption: string; handle?: string; link: string };
  };
};

type Labels = { example: string; nextFree: string; open: string; prev: string; next: string; swipeHint: string; placesLeft: string; booked: string; newBooking: string; yourCalendar: string; ownerSees: string; busy: string };

/** The times shown around the next free one in the little booking demo */
function nearbyTimes(time: string): string[] {
  const [h, m] = time.split(":").map(Number);
  const at = (d: number) => {
    const t = (((h * 60 + m + d) % 1440) + 1440) % 1440;
    return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  };
  return [at(-30), at(0), at(30)];
}

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
    <div className="swipe relative" onKeyDown={onKey}>
      <div className="relative">
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
                      <span key={it.name} className={`${n === 3 ? "hidden sm:flex" : "flex"} ${n === 0 ? "demo-pick" : ""} relative items-center justify-between gap-3 rounded-2xl border border-line/50 bg-surface/70 px-3.5 py-2 text-[14px]`}>
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
                  {/* Beat 1 and beat 3 of the story play over the example page */}
                  <ArriveScene arrive={c.preview.arrive} initial={c.preview.initial} name={c.preview.name} />
                  <OwnerScene preview={c.preview} labels={labels} />
                  {/* Beat 2: a short booking on the page itself: next free -> pick a time -> booked */}
                  <span className="demo-stage relative mt-4 block h-[60px] overflow-hidden rounded-full bg-[var(--pill-bg)] text-[var(--pill-fg)]">
                    <span className="demo-next absolute inset-0 flex items-center justify-between py-2 pl-5 pr-2">
                      <span className="min-w-0 leading-tight">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">{labels.nextFree}</span>
                        <span className="block truncate text-[12.5px] opacity-90">{c.preview.nextFree.day}</span>
                      </span>
                      <span className="display text-[26px] text-[var(--pill-time)] tabular-nums px-2">{c.preview.nextFree.time}</span>
                    </span>
                    <span aria-hidden className="demo-times absolute inset-0 flex items-center justify-center gap-2 px-3">
                      {nearbyTimes(c.preview.nextFree.time).map((tm, k) => (
                        <span key={tm} className={`relative rounded-full px-3.5 py-1.5 text-[14px] font-semibold tabular-nums ring-1 ring-white/15 ${k === 1 ? "demo-time" : "opacity-70"}`}>
                          {tm}
                        </span>
                      ))}
                    </span>
                    <span aria-hidden className="demo-booked absolute inset-0 flex items-center gap-3 py-2 pl-2 pr-5">
                      <span className="demo-check grid shrink-0 place-items-center size-11 rounded-full bg-accent text-accent-ink">
                        <Check className="size-5" strokeWidth={3} />
                      </span>
                      <span className="min-w-0 leading-tight">
                        <span className="block text-[14px] font-semibold">{labels.booked}</span>
                        <span className="block truncate text-[12px] opacity-80">
                          {c.preview.items[0]?.name} · {c.preview.nextFree.time}
                        </span>
                      </span>
                    </span>
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

      {/* Desktop: big arrows beside the centred card, where the eye already is */}
      <button
        type="button"
        onClick={() => goTo(Math.max(0, active - 1))}
        disabled={active === 0}
        aria-label={labels.prev}
        className="swipe-side swipe-side-prev hidden sm:grid place-items-center rounded-full border border-[var(--glass-border)] bg-glass-strong text-ink shadow-lift backdrop-blur-xl hover:bg-surface hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-0 cursor-pointer"
      >
        <ChevronLeft className="size-7" />
      </button>
      <button
        type="button"
        onClick={() => goTo(Math.min(cards.length - 1, active + 1))}
        disabled={active === cards.length - 1}
        aria-label={labels.next}
        className="swipe-side swipe-side-next hidden sm:grid place-items-center rounded-full bg-accent text-accent-ink shadow-[0_16px_36px_-14px_var(--accent)] hover:bg-accent-hover hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-0 cursor-pointer"
      >
        <ChevronRight className="size-7" />
      </button>
      </div>

      {/* Position and direct jumps */}
      <div className="mt-1 flex items-center justify-center gap-2.5 sm:gap-4">
        <button type="button" onClick={() => goTo(Math.max(0, active - 1))} disabled={active === 0} aria-label={labels.prev} className="grid sm:hidden shrink-0 place-items-center size-11 rounded-full border border-[var(--glass-border)] bg-glass-strong text-ink shadow-soft backdrop-blur-xl hover:bg-surface active:scale-95 disabled:opacity-35 disabled:shadow-none transition cursor-pointer">
          <ChevronLeft className="size-6" />
        </button>
        <div className="flex items-center">
          {cards.map((c, i) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => goTo(i)}
              aria-label={c.title}
              aria-current={i === active ? "true" : undefined}
              className="grid place-items-center h-8 w-6 sm:w-7 cursor-pointer"
            >
              <span className={`block h-2 rounded-full transition-all duration-300 ${i === active ? "w-6 sm:w-7 bg-accent" : "w-2 bg-muted/45 hover:bg-muted/70"}`} />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => goTo(Math.min(cards.length - 1, active + 1))} disabled={active === cards.length - 1} aria-label={labels.next} className="grid sm:hidden shrink-0 place-items-center size-11 rounded-full bg-accent text-accent-ink shadow-[0_12px_28px_-12px_var(--accent)] hover:bg-accent-hover active:scale-95 disabled:opacity-35 disabled:shadow-none transition cursor-pointer">
          <ChevronRight className="size-6" />
        </button>
      </div>
      <p className="mt-2 text-center text-[14px] text-muted sm:hidden">{labels.swipeHint}</p>
    </div>
  );
}

// ------------------------------------------------------------ story scenes

/** A QR-style pattern (drawn, not a real code) that stays the same for each business */
function QrPattern({ seed }: { seed: string }) {
  const n = 21;
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const cells: [number, number][] = [];
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (finder(x, y)) continue;
      h = Math.imul(h ^ (x * 31 + y), 2246822507) >>> 0;
      if (h % 100 < 46) cells.push([x, y]);
    }
  }
  const eye = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} rx={1.6} fill="currentColor" />
      <rect x={x + 1} y={y + 1} width={5} height={5} rx={1.1} fill="var(--surface)" />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.7} fill="currentColor" />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="size-full" aria-hidden>
      {eye(0, 0)}
      {eye(n - 7, 0)}
      {eye(0, n - 7)}
      {cells.map(([x, y]) => (
        <rect key={`${x}.${y}`} x={x + 0.08} y={y + 0.08} width={0.84} height={0.84} rx={0.25} fill="currentColor" />
      ))}
    </svg>
  );
}

/** Beat 1: how a client gets to the booking page */
function ArriveScene({ arrive, initial, name }: { arrive: NonNullable<CarouselCard["preview"]>["arrive"]; initial: string; name: string }) {
  return (
    <span aria-hidden className="demo-arrive absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 rounded-[inherit] bg-bg p-5 text-center">
      {arrive.kind === "qr" && (
        <span className="relative grid place-items-center">
          <span className="block size-[132px] rounded-[22px] bg-surface p-3 text-ink shadow-lift ring-1 ring-line">
            <QrPattern seed={name} />
          </span>
          {/* a phone comes up and scans */}
          <span className="demo-phone absolute -bottom-7 -right-14 block h-[100px] w-[56px] rounded-[14px] border-[3px] border-ink/80 bg-bg shadow-lift">
            <span className="absolute inset-x-2 top-3 bottom-3 overflow-hidden rounded-[8px] bg-accent-soft">
              <span className="demo-scan absolute inset-x-0 h-[2px] bg-accent shadow-[0_0_12px_var(--accent)]" />
            </span>
          </span>
        </span>
      )}
      {arrive.kind === "instagram" && (
        <span className="w-full max-w-[250px] rounded-[22px] bg-surface p-4 text-left shadow-lift ring-1 ring-line">
          <span className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-accent-ink display text-[20px] ring-2 ring-accent ring-offset-2 ring-offset-surface">{initial}</span>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-semibold">{arrive.handle}</span>
              <span className="mt-1.5 flex gap-1.5">
                <span className="block h-1.5 w-8 rounded-full bg-line" />
                <span className="block h-1.5 w-8 rounded-full bg-line" />
                <span className="block h-1.5 w-8 rounded-full bg-line" />
              </span>
            </span>
          </span>
          <span className="mt-3 block text-[12px] font-semibold">{name}</span>
          <span className="mt-1 block h-1.5 w-4/5 rounded-full bg-line" />
          <span className="demo-link relative mt-2 inline-flex items-center gap-1 rounded-md px-1 text-[12px] font-semibold text-accent">
            <Link2 className="size-3.5" /> {arrive.link}
          </span>
        </span>
      )}
      {arrive.kind === "chat" && (
        <span className="w-full max-w-[250px] space-y-2 text-left">
          <span className="block w-3/4 rounded-[16px] rounded-bl-md bg-surface px-3.5 py-2 text-[12.5px] shadow-soft ring-1 ring-line">
            <span className="block h-1.5 w-full rounded-full bg-line" />
            <span className="mt-1.5 block h-1.5 w-2/3 rounded-full bg-line" />
          </span>
          <span className="demo-link relative ml-auto block w-[88%] rounded-[16px] rounded-br-md bg-accent px-3.5 py-2.5 text-[12.5px] text-accent-ink shadow-soft">
            <span className="flex items-center gap-1.5 font-semibold">
              <Link2 className="size-3.5" /> {arrive.link}
            </span>
            <span className="mt-0.5 block opacity-85">{name}</span>
          </span>
        </span>
      )}
      <span className="max-w-[240px] text-[14px] font-medium leading-snug">{arrive.caption}</span>
    </span>
  );
}

/** Beat 3: what the owner sees */
function OwnerScene({ preview, labels }: { preview: NonNullable<CarouselCard["preview"]>; labels: Labels }) {
  const [before, at, after] = [-60, 0, 60].map((d) => {
    const [h, m] = preview.nextFree.time.split(":").map(Number);
    const t = (((h * 60 + m + d) % 1440) + 1440) % 1440;
    return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  });
  const service = preview.items[0]?.name ?? "";
  return (
    <span aria-hidden className="demo-owner absolute inset-0 z-10 flex flex-col gap-3 rounded-[inherit] bg-bg p-4 sm:p-5 text-left">
      {/* the notification */}
      <span className="demo-toast flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-lift ring-1 ring-line">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink">
          <Bell className="size-4" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-[12.5px] font-semibold">{labels.newBooking}</span>
          <span className="block truncate text-[12px] text-muted">
            Ana · {service} · {at}
          </span>
        </span>
      </span>
      {/* the owner calendar, the slot fills */}
      <span className="flex-1 rounded-2xl border border-line/60 bg-surface/60 p-3">
        <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{labels.yourCalendar}</span>
        <span className="mt-2.5 block space-y-1.5">
          <span className="flex items-center gap-2.5 text-[12px]">
            <span className="w-10 shrink-0 tabular-nums text-muted">{before}</span>
            <span className="flex-1 rounded-lg bg-line/60 px-2.5 py-1.5 text-muted">{labels.busy}</span>
          </span>
          <span className="flex items-center gap-2.5 text-[12px]">
            <span className="w-10 shrink-0 tabular-nums font-semibold">{at}</span>
            <span className="demo-slot relative flex-1 overflow-hidden rounded-lg border border-dashed border-line px-2.5 py-1.5">
              <span className="demo-slot-fill absolute inset-0 bg-accent" />
              <span className="demo-slot-text relative block truncate font-semibold text-accent-ink">Ana · {service}</span>
            </span>
          </span>
          <span className="flex items-center gap-2.5 text-[12px]">
            <span className="w-10 shrink-0 tabular-nums text-muted">{after}</span>
            <span className="flex-1 rounded-lg border border-dashed border-line px-2.5 py-1.5">&nbsp;</span>
          </span>
        </span>
      </span>
      <span className="text-center text-[14px] font-medium leading-snug">{labels.ownerSees}</span>
    </span>
  );
}
