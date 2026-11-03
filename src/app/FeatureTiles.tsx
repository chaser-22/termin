"use client";

import { useEffect, useRef } from "react";
import { Bell, Phone } from "lucide-react";
import type { FeatureKind } from "./features";
import { QrPattern } from "./IndustryCarousel";

type Mini = { reminder: string; tomorrow: string; cancel: string; free: string; byPhone: string; online: string; book: string };

// "What else you get": six small tiles, each with a 4-second animation that
// plays only while the tile is on screen (and never with reduced motion). The
// section takes the colour of the industry chosen in the carousel above.
export function FeatureTiles({
  title,
  items,
  mini,
  bookBoth,
}: {
  title: string;
  items: { kind: FeatureKind; title: string; body: string }[];
  mini: Mini;
  /** "Zakažite termin" and "Book an appointment", for the language tile */
  bookBoth: [string, string];
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const tiles = ref.current?.querySelectorAll<HTMLElement>(".feat");
    if (!tiles?.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) (e.target as HTMLElement).dataset.inview = "";
          else delete (e.target as HTMLElement).dataset.inview;
        }
      },
      { threshold: 0.35 },
    );
    tiles.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id="features" aria-labelledby="features-title" className="mx-auto mt-14 w-full max-w-5xl">
      <h2 id="features-title" className="display text-center text-[24px] sm:text-[30px] font-semibold tracking-[-0.02em]">
        {title}
      </h2>
      <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
        {items.map((f) => (
          <li key={f.kind} className="feat card overflow-hidden p-3 sm:p-4">
            <div aria-hidden className="relative grid h-[104px] grid-cols-1 place-items-center overflow-hidden rounded-2xl border border-line/50 bg-bg/70">
              <Scene kind={f.kind} mini={mini} bookBoth={bookBoth} />
            </div>
            <h3 className="mt-3 text-[14.5px] sm:text-[16px] font-semibold leading-snug tracking-[-0.01em]">{f.title}</h3>
            <p className="mt-1 text-[12.5px] sm:text-[13.5px] leading-snug text-muted">{f.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Scene({ kind, mini, bookBoth }: { kind: FeatureKind; mini: Mini; bookBoth: [string, string] }) {
  switch (kind) {
    case "reminder":
      return (
        <div className="relative grid h-full w-full place-items-center">
          <span className="f-phone block h-[80px] w-[50px] rounded-[12px] border-2 border-ink/60 bg-surface/40" />
          <span className="f-bubble absolute top-4 left-1/2 flex w-[86%] max-w-[190px] -translate-x-1/2 items-center gap-2 rounded-xl bg-surface px-2.5 py-1.5 text-left shadow-lift ring-1 ring-line">
            <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-accent text-accent-ink">
              <Bell className="size-3.5" />
            </span>
            <span className="min-w-0 text-[11px] leading-tight">
              <b className="block font-semibold">{mini.reminder}</b>
              <span className="text-muted">{mini.tomorrow} 11:00</span>
            </span>
          </span>
        </div>
      );
    case "cancel":
      return (
        <div className="w-full space-y-2 px-3">
          <div className="flex items-center gap-2 text-[11.5px]">
            <span className="w-9 shrink-0 font-semibold tabular-nums">11:00</span>
            <span className="relative block h-7 flex-1 overflow-hidden rounded-lg border border-dashed border-line">
              <span className="f-cancel-fill absolute inset-0 bg-accent" />
              <span className="f-cancel-name absolute inset-0 flex items-center px-2 font-semibold text-accent-ink">Ana</span>
              <span className="f-cancel-free absolute inset-0 flex items-center px-2 text-muted">{mini.free}</span>
            </span>
          </div>
          <div className="flex justify-end">
            <span className="f-cancel-btn relative rounded-full border border-danger/50 px-2.5 py-1 text-[11px] font-semibold text-danger">{mini.cancel}</span>
          </div>
        </div>
      );
    case "phone":
      return (
        <div className="w-full space-y-1.5 px-2 text-[11.5px] min-[360px]:px-3">
          <div className="flex items-center gap-1.5 min-[360px]:gap-2">
            <span className="w-8 shrink-0 tabular-nums text-muted min-[360px]:w-9">10:00</span>
            <span className="flex h-7 min-w-0 flex-1 items-center rounded-lg bg-accent-soft px-1.5 font-medium min-[360px]:px-2">
              <span className="truncate">Ana</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-[360px]:gap-2">
            <span className="w-8 shrink-0 font-semibold tabular-nums min-[360px]:w-9">15:00</span>
            {/* the phone badge sits on the corner so the name keeps the whole row on narrow phones */}
            <span className="f-phone-row relative flex h-7 min-w-0 flex-1 items-center rounded-lg bg-accent px-1.5 font-semibold text-accent-ink min-[360px]:px-2">
              <span className="truncate">Marko</span>
              <span className="absolute -top-1.5 -right-1.5 grid size-[18px] place-items-center rounded-full bg-surface text-accent shadow-lift ring-1 ring-line">
                <Phone className="size-2.5" />
              </span>
            </span>
          </div>
        </div>
      );
    case "staff":
      return (
        <div className="grid w-full grid-cols-2 gap-2 px-3 text-[11px]">
          {["Ana", "Marko"].map((name, col) => (
            <div key={name} className="space-y-1">
              <div className="text-center font-semibold text-muted">{name}</div>
              {[0, 1, 2].map((row) => (
                <span key={row} className="relative block h-[17px] overflow-hidden rounded-md border border-dashed border-line">
                  {(col + row) % 3 !== 2 && <span className={`f-staff-block f-staff-${col * 3 + row} absolute inset-0 bg-accent`} />}
                </span>
              ))}
            </div>
          ))}
        </div>
      );
    case "qr":
      return (
        <div className="flex flex-col items-center gap-1.5 px-3">
          <span className="f-qr block size-[64px] shrink-0 rounded-xl bg-surface p-1.5 text-ink ring-1 ring-line">
            <QrPattern seed="termin" />
          </span>
          <span className="f-qr-link rounded-lg bg-accent-soft px-2 py-0.5 text-[10.5px] font-semibold text-accent">termin.me</span>
        </div>
      );
    case "languages":
      return (
        <div className="flex w-full flex-col items-center gap-2.5 px-3">
          <span className="relative flex rounded-full border border-line p-0.5 text-[10.5px] font-semibold">
            <span className="f-lang-thumb absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-ink" />
            <span className="f-lang-me relative w-10 py-0.5 text-center">MNE</span>
            <span className="f-lang-en relative w-10 py-0.5 text-center">EN</span>
          </span>
          <span className="relative grid h-8 w-full max-w-[200px] place-items-center whitespace-nowrap rounded-full bg-accent text-[12px] font-semibold text-accent-ink">
            <span className="f-lang-text-me absolute">{bookBoth[0]}</span>
            <span className="f-lang-text-en absolute">{bookBoth[1]}</span>
          </span>
        </div>
      );
  }
}
