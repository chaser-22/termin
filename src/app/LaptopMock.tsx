"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/dict";

// A drawn owner calendar: two people, a day of bookings, and new online
// bookings that glide in one after another.
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const ROW = 40; // px per hour

type Block = { col: number; start: number; len: number; name: string; what: { me: string; en: string } };

const BLOCKS: Block[] = [
  { col: 0, start: 9, len: 0.5, name: "Nikola", what: { me: "Šišanje", en: "Haircut" } },
  { col: 0, start: 10, len: 0.75, name: "Luka", what: { me: "Šišanje i brada", en: "Cut & beard" } },
  { col: 0, start: 13, len: 0.5, name: "Petar", what: { me: "Brada", en: "Beard" } },
  { col: 1, start: 9.5, len: 1, name: "Ana", what: { me: "Farbanje", en: "Colour" } },
  { col: 1, start: 12, len: 0.5, name: "Mila", what: { me: "Feniranje", en: "Blow-dry" } },
  { col: 1, start: 14.5, len: 0.75, name: "Sara", what: { me: "Manikir", en: "Manicure" } },
  { col: 0, start: 16, len: 0.75, name: "Vuk", what: { me: "Šišanje i brada", en: "Cut & beard" } },
];

const INCOMING: Block[] = [
  { col: 0, start: 11.5, len: 0.5, name: "Marko", what: { me: "Šišanje", en: "Haircut" } },
  { col: 1, start: 15.75, len: 0.75, name: "Jelena", what: { me: "Feniranje", en: "Blow-dry" } },
  { col: 0, start: 14.5, len: 0.75, name: "Stefan", what: { me: "Šišanje i brada", en: "Cut & beard" } },
];

const fmt = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

export function LaptopMock({ locale, labels }: { locale: Locale; labels: { today: string; newBooking: string; people: [string, string] } }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setN((x) => (x + 1) % INCOMING.length), 3600);
    return () => clearInterval(id);
  }, []);

  return (
    <div aria-hidden className="w-full">
      {/* Lid */}
      <div className="relative rounded-t-[22px] bg-gradient-to-b from-[#2b2e2e] to-[#0d0e0e] p-[10px] pb-3 shadow-lift ring-1 ring-white/10">
        <span className="absolute left-1/2 top-[4px] size-[5px] -translate-x-1/2 rounded-full bg-[#3a3d3d]" />
        <div className="relative overflow-hidden rounded-[12px] bg-bg">
          {/* Screen glare */}
          <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(115deg,rgb(255_255_255/0.07)_0%,transparent_35%)]" />
          <div className="flex items-center gap-2.5 border-b border-line/60 px-5 py-3">
            <span className="grid size-6 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-ink">B</span>
            <span className="display text-[15px]">Berbernica Marko</span>
            <span className="ml-auto rounded-full bg-ink px-3 py-1 text-[11px] font-semibold text-bg">{labels.today}</span>
          </div>
          <div className="grid grid-cols-[44px_1fr_1fr] gap-x-2 px-4 pt-3 text-[11.5px] font-semibold text-muted">
            <span />
            <span className="flex items-center gap-1.5">
              <span className="size-4 rounded-full bg-accent-soft" /> {labels.people[0]}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-4 rounded-full bg-accent-soft" /> {labels.people[1]}
            </span>
          </div>
          <div className="relative mx-4 mb-4 mt-2" style={{ height: (HOURS.length - 0.5) * ROW }}>
            {HOURS.map((h, i) => (
              <div key={h} className="absolute inset-x-0 border-t border-line/50" style={{ top: i * ROW }}>
                <span className="absolute -top-px pt-0.5 text-[10.5px] tabular-nums text-muted">{fmt(h)}</span>
              </div>
            ))}
            {/* Now line */}
            <div className="absolute left-[44px] right-0 z-[1] h-px bg-danger" style={{ top: 2.6 * ROW }}>
              <span className="absolute -left-1 -top-[3px] size-[7px] rounded-full bg-danger" />
            </div>
            {BLOCKS.map((b, i) => (
              <Booking key={i} b={b} locale={locale} style={{ animationDelay: `${300 + i * 80}ms` }} className="animate-pop-in bg-accent-soft text-ink" />
            ))}
            {INCOMING.map((b, i) => (
              <Booking
                key={`in-${i}`}
                b={b}
                locale={locale}
                className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  i === n ? "opacity-100 translate-y-0 scale-100 bg-accent text-accent-ink shadow-[0_10px_24px_-10px_var(--accent)]" : "opacity-0 -translate-y-2 scale-95 bg-accent-soft text-ink"
                }`}
                badge={i === n ? labels.newBooking : undefined}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Base */}
      <div className="relative mx-auto h-[14px] w-[112%] -translate-x-[5.4%] rounded-b-[18px] bg-gradient-to-b from-[#3a3d3d] to-[#141515] shadow-[0_18px_30px_-18px_rgb(0_0_0/0.6)]">
        <span className="absolute left-1/2 top-0 h-[5px] w-[18%] -translate-x-1/2 rounded-b-lg bg-[#1d1f1f]" />
      </div>
    </div>
  );
}

function Booking({ b, locale, className, style, badge }: { b: Block; locale: Locale; className: string; style?: React.CSSProperties; badge?: string }) {
  return (
    <div
      className={`absolute z-[2] overflow-hidden rounded-[10px] px-2.5 py-1.5 text-[11px] leading-tight ${className}`}
      style={{
        top: (b.start - HOURS[0]) * ROW + 1.5,
        height: b.len * ROW - 3,
        left: `calc(46px + ${b.col} * ((100% - 46px) / 2))`,
        width: "calc((100% - 46px) / 2 - 8px)",
        ...style,
      }}
    >
      <span className="font-bold tabular-nums">{fmt(b.start)}</span> {b.name}
      {b.len >= 0.75 && <span className="block opacity-75">{b.what[locale]}</span>}
      {badge && <span className="absolute right-1.5 top-1.5 hidden rounded-full bg-black/15 px-1.5 py-px text-[9px] font-bold uppercase sm:block">{badge}</span>}
    </div>
  );
}
