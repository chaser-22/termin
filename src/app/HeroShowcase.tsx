"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Clock, Sparkles, Users } from "lucide-react";
import { Odometer } from "@/components/Odometer";

type Mode = "person" | "place" | "class";
// Which phone each rotating word shows: barbershop, court, yoga, clinic, rentals, salon
const MODE_FOR_WORD: Mode[] = ["person", "place", "class", "person", "place", "person"];

type Props = {
  /** Shown above and below the headline (eyebrow; body and buttons) */
  top: ReactNode;
  bottom: ReactNode;
  caption: string;
  lead: string;
  words: string[];
  labels: {
    nextFree: string;
    today: string;
    tomorrow: string;
    openUntil: string;
    chooseService: string;
    chooseResource: string;
    anyResource: string;
    groupClass: string;
    placesLeft: string;
    lastPlace: string;
    welcomeBack: string;
  };
};

/** Hero headline with a rotating business type, and a phone preview that switches with it. */
export function HeroShowcase({ top, bottom, caption, lead, words, labels }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), 2800);
    return () => clearInterval(id);
  }, [words.length]);

  const mode = MODE_FOR_WORD[index % MODE_FOR_WORD.length];

  return (
    <div className="relative mx-auto max-w-6xl px-5 pt-8 pb-20 lg:pt-14 grid gap-14 lg:grid-cols-[1.1fr_0.9fr] items-center">
      <div className="min-w-0">
      {top}
      <h1 className="display text-[38px] sm:text-[54px] lg:text-[64px] mt-5 animate-rise [animation-delay:60ms]">
        {lead}{" "}
        {/* The word rolls in from below; the sizer keeps the line height stable */}
        <span className="relative inline-grid overflow-hidden align-bottom pb-[0.08em] text-accent">
          <span key={index} className="col-start-1 row-start-1 animate-[word-in_0.6s_var(--ease-out-soft)_both]">
            {words[index]}.
          </span>
        </span>
      </h1>
      {bottom}
      </div>
      <div className="relative mx-auto animate-rise [animation-delay:200ms]">
        <div aria-hidden>
        <div className="relative w-[300px] sm:w-[330px] rounded-[48px] bg-[#0c0d0d] p-3 shadow-lift rotate-[-2deg]">
          <div className="relative h-[560px] overflow-hidden rounded-[38px] bg-bg">
            <div
              className="absolute inset-0"
              style={{ background: "repeating-radial-gradient(ellipse at 80% 10%, transparent 0 16px, var(--contour) 16px 17px), radial-gradient(80% 40% at 50% 0%, var(--bg-top), transparent 70%)" }}
            />
            <div className="absolute left-1/2 top-2.5 z-10 -translate-x-1/2 h-6 w-24 rounded-full bg-[#0c0d0d]" />
            {(["person", "place", "class"] as Mode[]).map((m) => (
              <div
                key={m}
                className={`absolute inset-0 transition-[opacity,filter,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  m === mode ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-sm scale-[0.98] pointer-events-none"
                }`}
              >
                <Screen mode={m} labels={labels} />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -left-16 top-[64%] hidden sm:flex items-center gap-2 rounded-2xl card px-3.5 py-2.5 rotate-[3deg]">
          <Sparkles className="size-4 text-accent" />
          <span className="text-[13px] font-semibold">{labels.welcomeBack}, Ana</span>
        </div>
        </div>
        <p className="mt-5 text-center text-sm text-muted">{caption}</p>
      </div>
    </div>
  );
}

function Screen({ mode, labels }: { mode: Mode; labels: Props["labels"] }) {
  const header =
    mode === "person"
      ? { initial: "B", type: "Berbernica · Podgorica", name: "Berbernica Marko" }
      : mode === "place"
        ? { initial: "P", type: "Tereni · Budva", name: "Padel Budva" }
        : { initial: "J", type: "Fitness i joga · Kotor", name: "Joga Kotor" };
  const pill =
    mode === "person"
      ? { day: `${labels.today} · Muško šišanje`, time: "14:00" }
      : mode === "place"
        ? { day: `${labels.today} · Teren 90 min`, time: "19:30" }
        : { day: `${labels.tomorrow} · Joga`, time: "18:00" };

  return (
    <div className="relative h-full px-4 pt-12 flex flex-col items-center text-center">
      <span className="grid place-items-center size-14 rounded-full bg-accent text-accent-ink display text-2xl shadow-[0_0_0_5px_var(--glass)]">{header.initial}</span>
      <p className="eyebrow text-[8.5px] mt-4">{header.type}</p>
      <p className="display text-[26px] mt-1.5">{header.name}</p>
      <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-glass border border-[var(--glass-border)] px-2.5 py-1 text-[10.5px] font-semibold text-ok">
        <span className="size-1.5 rounded-full bg-ok" /> {labels.openUntil}
      </span>

      {mode === "person" && (
        <div className="mt-4 grid w-full grid-cols-2 gap-2 text-left">
          {[
            ["Muško šišanje", "30 min", "10 €"],
            ["Šišanje i brada", "45 min", "15 €"],
            ["Uređivanje brade", "15 min", "5 €"],
            ["Dječije šišanje", "20 min", "7 €"],
          ].map(([n, d, p]) => (
            <Tile key={n} name={n} meta={d} price={p} />
          ))}
        </div>
      )}

      {mode === "place" && (
        <div className="mt-4 w-full space-y-2.5 text-left">
          <div className="card rounded-[18px] p-3">
            <p className="text-[11px] font-semibold text-muted">{labels.chooseResource}</p>
            <div className="mt-2 flex gap-2">
              {[labels.anyResource, "Teren 1", "Teren 2"].map((r, i) => (
                <span key={r} className={`flex-1 rounded-full py-1.5 text-center text-[10.5px] font-semibold ${i === 0 ? "bg-accent text-accent-ink" : "bg-surface"}`}>
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {["17:00", "18:00", "19:30", "21:00"].map((x, i) => (
              <span key={x} className={`h-8 grid place-items-center rounded-lg border text-[11px] font-semibold tabular-nums ${i === 2 ? "bg-accent border-accent text-accent-ink" : "border-line bg-surface"}`}>
                {x}
              </span>
            ))}
          </div>
          <Tile name="Teren 90 min" meta="1 h 30 min" price="28 €" />
        </div>
      )}

      {mode === "class" && (
        <div className="mt-4 w-full space-y-2 text-left">
          {[
            ["Joga", "18:00", 3],
            ["Pilates", "19:00", 1],
            ["Funkcionalni trening", "07:30", 9],
          ].map(([n, time, left]) => (
            <div key={n as string} className="card rounded-[18px] p-3 flex items-center justify-between gap-2">
              <span>
                <span className="block text-[12px] font-semibold">{n}</span>
                <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-accent">
                  <Users className="size-3" /> {labels.groupClass}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-[13px] font-bold tabular-nums">{time}</span>
                <span className={`text-[10px] font-medium ${left === 1 ? "text-danger" : "text-muted"}`}>
                  {left === 1 ? labels.lastPlace : `${left} ${labels.placesLeft}`}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="absolute inset-x-2.5 bottom-2.5 rounded-full bg-[var(--pill-bg)] text-[var(--pill-fg)] p-1.5 pl-4 flex items-center gap-2 text-left">
        <div className="flex-1 min-w-0 leading-tight">
          <div className="text-[8.5px] font-semibold uppercase tracking-[0.14em] opacity-60">{labels.nextFree}</div>
          <div className="text-[10.5px] opacity-80 truncate">{pill.day}</div>
        </div>
        <Odometer value={pill.time} className="display text-[22px] text-[var(--pill-time)]" />
        <span className="grid place-items-center size-9 rounded-full bg-accent text-accent-ink">
          <ArrowRight className="size-4" />
        </span>
      </div>
    </div>
  );
}

function Tile({ name, meta, price }: { name: string; meta: string; price: string }) {
  return (
    <div className="card rounded-[18px] p-3 flex flex-col gap-4">
      <span className="text-[12px] font-semibold leading-tight">{name}</span>
      <span className="flex justify-between text-[10px] text-muted">
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {meta}
        </span>
        <span className="text-ink font-bold text-[11px]">{price}</span>
      </span>
    </div>
  );
}
