import { ArrowRight, Clock, Users } from "lucide-react";
import type { Locale } from "@/i18n/dict";
import type { MockData } from "@/lib/verticals";
import { Odometer } from "./Odometer";

type Labels = {
  nextFree: string;
  openUntil: string;
  chooseResource: string;
  anyResource: string;
  groupClass: string;
  placesLeft: string;
  lastPlace: string;
};

/** A drawn picture of a business's booking page, so owners see what clients see. */
export function PhoneMock({ mock, locale, labels }: { mock: MockData; locale: Locale; labels: Labels }) {
  return (
    <div aria-hidden className="relative w-[290px] sm:w-[320px] rounded-[48px] bg-gradient-to-b from-[#2b2e2e] to-[#0c0d0d] p-3 shadow-lift ring-1 ring-white/10 rotate-[-2deg]">
      <div className="relative h-[540px] overflow-hidden rounded-[38px] bg-bg">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 40% at 20% 15%, var(--glow-a), transparent 70%), repeating-radial-gradient(ellipse at 80% 10%, transparent 0 16px, var(--contour) 16px 17px)",
          }}
        />
        <div className="absolute left-1/2 top-2.5 z-10 -translate-x-1/2 h-6 w-24 rounded-full bg-[#0c0d0d]" />
        <div className="relative h-full px-4 pt-12 flex flex-col items-center text-center">
          <span className="grid place-items-center size-14 rounded-full bg-accent text-accent-ink display text-2xl shadow-[0_0_0_5px_var(--glass)]">{mock.initial}</span>
          <p className="eyebrow text-[9px] mt-4">{mock.typeLabel[locale]}</p>
          <p className="display text-[24px] mt-1.5">{mock.name}</p>
          <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-glass border border-[var(--glass-border)] px-2.5 py-1 text-[11px] font-semibold text-ok">
            <span className="size-1.5 rounded-full bg-ok" /> {labels.openUntil}
          </span>

          {mock.mode === "class" ? (
            <div className="mt-4 w-full space-y-2 text-left">
              {mock.items.map((c) => (
                <div key={c.name.en} className="card rounded-[18px] p-3 flex items-center justify-between gap-2">
                  <span>
                    <span className="block text-[12.5px] font-semibold">{c.name[locale]}</span>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] font-semibold text-accent">
                      <Users className="size-3" /> {labels.groupClass}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[13px] font-bold tabular-nums">{c.meta}</span>
                    <span className={`text-[10.5px] font-semibold ${c.left === 1 ? "text-danger" : "text-muted"}`}>
                      {c.left === 1 ? labels.lastPlace : `${c.left} ${labels.placesLeft}`}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <>
              {mock.mode === "place" && (
                <div className="mt-4 w-full flex gap-1.5">
                  {[labels.anyResource, "1", "2"].map((r, i) => (
                    <span key={r} className={`flex-1 rounded-full py-1.5 text-center text-[10.5px] font-semibold ${i === 0 ? "bg-accent text-accent-ink" : "bg-glass-strong border border-[var(--glass-border)]"}`}>
                      {r}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 grid w-full grid-cols-2 gap-2 text-left">
                {mock.items.map((s) => (
                  <div key={s.name.en} className="card rounded-[18px] p-3 flex flex-col gap-4">
                    <span className="text-[12px] font-semibold leading-tight">{s.name[locale]}</span>
                    <span className="flex justify-between text-[10.5px] text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {s.meta}
                      </span>
                      <span className="text-ink font-bold text-[11px]">{s.price}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="absolute inset-x-2.5 bottom-2.5 rounded-full bg-[var(--pill-bg)] text-[var(--pill-fg)] backdrop-blur-xl border border-white/10 p-1.5 pl-4 flex items-center gap-2 text-left">
            <div className="flex-1 min-w-0 leading-tight">
              <div className="text-[9px] font-bold uppercase tracking-[0.14em] opacity-80">{labels.nextFree}</div>
              <div className="text-[11px] opacity-90 truncate">{mock.pill.day[locale]}</div>
            </div>
            <Odometer value={mock.pill.time} className="display text-[22px] text-[var(--pill-time)]" />
            <span className="grid place-items-center size-9 rounded-full bg-accent text-accent-ink">
              <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
