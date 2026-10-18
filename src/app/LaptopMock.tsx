"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/dict";

// A drawn owner calendar: two people, a day of bookings, and a new online
// booking that drops in every few seconds.
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16];
const ROW = 34; // px per hour

type Block = { col: number; start: number; len: number; name: string; what: { me: string; en: string } };

const BLOCKS: Block[] = [
  { col: 0, start: 9, len: 0.5, name: "Nikola", what: { me: "Šišanje", en: "Haircut" } },
  { col: 0, start: 10, len: 0.75, name: "Luka", what: { me: "Šišanje i brada", en: "Cut & beard" } },
  { col: 0, start: 13, len: 0.5, name: "Petar", what: { me: "Brada", en: "Beard" } },
  { col: 1, start: 9.5, len: 1, name: "Ana", what: { me: "Farbanje", en: "Colour" } },
  { col: 1, start: 12, len: 0.5, name: "Mila", what: { me: "Feniranje", en: "Blow-dry" } },
  { col: 1, start: 14.5, len: 0.75, name: "Sara", what: { me: "Manikir", en: "Manicure" } },
];

const INCOMING: Block[] = [
  { col: 0, start: 11.5, len: 0.5, name: "Marko", what: { me: "Šišanje", en: "Haircut" } },
  { col: 1, start: 15.5, len: 0.5, name: "Jelena", what: { me: "Feniranje", en: "Blow-dry" } },
  { col: 0, start: 15, len: 0.75, name: "Stefan", what: { me: "Šišanje i brada", en: "Cut & beard" } },
];

const fmt = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${h % 1 ? String(Math.round((h % 1) * 60)).padStart(2, "0") : "00"}`;

export function LaptopMock({ locale, labels }: { locale: Locale; labels: { today: string; newBooking: string; people: [string, string] } }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setN((x) => (x + 1) % INCOMING.length), 3600);
    return () => clearInterval(id);
  }, []);
  const fresh = INCOMING[n];

  return (
    <div aria-hidden className="w-full max-w-[560px]">
      {/* Screen */}
      <div className="rounded-t-[18px] bg-[#0c0d0d] p-2 pb-2.5 shadow-lift">
        <div className="overflow-hidden rounded-[10px] bg-bg">
          <div className="flex items-center gap-2 border-b border-line/60 px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-accent" />
            <span className="display text-[13px]">Berbernica Marko</span>
            <span className="ml-auto rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-semibold text-bg">{labels.today}</span>
          </div>
          <div className="grid grid-cols-[38px_1fr_1fr] gap-x-2 px-3 pt-2 text-[10px] font-semibold text-muted">
            <span />
            <span>{labels.people[0]}</span>
            <span>{labels.people[1]}</span>
          </div>
          <div className="relative mx-3 mb-3 mt-1.5" style={{ height: HOURS.length * ROW }}>
            {HOURS.map((h, i) => (
              <div key={h} className="absolute inset-x-0 flex items-start border-t border-line/50" style={{ top: i * ROW }}>
                <span className="w-[38px] -mt-px pt-0.5 text-[9.5px] tabular-nums text-muted">{fmt(h)}</span>
              </div>
            ))}
            {BLOCKS.map((b, i) => (
              <Booking key={i} b={b} locale={locale} delay={200 + i * 90} />
            ))}
            <Booking key={`new-${n}`} b={fresh} locale={locale} fresh label={labels.newBooking} />
          </div>
        </div>
      </div>
      {/* Base */}
      <div className="mx-auto h-3 w-[108%] -translate-x-[3.7%] rounded-b-[14px] bg-gradient-to-b from-[#2a2c2c] to-[#121313]" />
    </div>
  );
}

function Booking({ b, locale, delay = 0, fresh, label }: { b: Block; locale: Locale; delay?: number; fresh?: boolean; label?: string }) {
  return (
    <div
      className={`absolute rounded-lg px-2 py-1 text-[10px] leading-tight overflow-hidden animate-pop-in ${
        fresh ? "bg-accent text-accent-ink shadow-[0_8px_20px_-8px_var(--accent)]" : "bg-accent-soft text-ink"
      }`}
      style={{
        top: (b.start - HOURS[0]) * ROW + 1,
        height: b.len * ROW - 2,
        left: `calc(40px + ${b.col} * ((100% - 40px) / 2))`,
        width: "calc((100% - 40px) / 2 - 6px)",
        animationDelay: `${delay}ms`,
      }}
    >
      <span className="font-bold tabular-nums">{fmt(b.start)}</span> {b.name}
      {b.len >= 0.75 && <span className="block opacity-75">{b.what[locale]}</span>}
      {fresh && <span className="hidden lg:block absolute right-1.5 top-1 rounded-full bg-accent-ink/20 px-1.5 text-[8.5px] font-bold uppercase">{label}</span>}
    </div>
  );
}
