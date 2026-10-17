import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, CalendarCheck2, Check, Clock, QrCode, RotateCcw, Share2, Sparkles, Store, Zap } from "lucide-react";
import { getDict } from "@/i18n/server";
import type { Dict } from "@/i18n/dict";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export default function Home() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <Landing />
    </Suspense>
  );
}

async function Landing() {
  const { locale, t } = await getDict();
  const h = t.home;
  const steps = [
    { icon: Store, title: h.step1Title, body: h.step1Body },
    { icon: QrCode, title: h.step2Title, body: h.step2Body },
    { icon: CalendarCheck2, title: h.step3Title, body: h.step3Body },
  ];
  const hooks = [
    { icon: RotateCcw, title: h.hook1Title, body: h.hook1Body },
    { icon: BellRing, title: h.hook2Title, body: h.hook2Body },
    { icon: Zap, title: h.hook3Title, body: h.hook3Body },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-x-clip">
      <header className="mx-auto w-full max-w-6xl px-5 py-5 flex items-center justify-between">
        <span className="display text-[28px]">{t.appName}</span>
        <div className="flex items-center gap-3">
          <LanguageSwitch current={locale} />
          <Link href="/login" className="btn-secondary btn-sm">
            {t.auth.signIn}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div
          aria-hidden
          className="absolute -top-40 right-[-20%] size-[720px] rounded-full opacity-25 blur-3xl dark:opacity-30"
          style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-5 pt-10 pb-20 lg:pt-16 grid gap-14 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div>
            <p className="eyebrow animate-rise">{h.eyebrow}</p>
            <h1 className="display text-[54px] sm:text-[76px] lg:text-[88px] mt-5 animate-rise [animation-delay:60ms]">
              {h.heroLead} <em className="text-accent">{h.heroItalic}</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted leading-relaxed animate-rise [animation-delay:120ms]">{h.heroBody}</p>
            <div className="mt-9 flex flex-wrap gap-3 animate-rise [animation-delay:180ms]">
              <Link href="/login" className="btn-primary h-13 px-7 text-base">
                {h.ctaBusiness} <ArrowRight className="size-4" />
              </Link>
              <Link href="/marko" className="btn-secondary h-13 px-7 text-base">
                {h.ctaDemo}
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted animate-rise [animation-delay:240ms]">
              {[t.book.noBookingFee, t.book.instantConfirm, "MNE · EN"].map((x) => (
                <li key={x} className="flex items-center gap-1.5">
                  <Check className="size-4 text-accent" /> {x}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto animate-rise [animation-delay:200ms]">
            <PhoneMock t={t} />
            <p className="mt-5 text-center text-sm text-muted">{h.demoCaption}</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow">{h.stepsTitle}</p>
          <div className="mt-8 grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title}>
                <div className="flex items-center gap-3">
                  <span className="display text-[44px] text-accent leading-none">0{i + 1}</span>
                  <s.icon className="size-5 text-muted" />
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-muted leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why clients come back */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="display text-[44px] sm:text-[60px] max-w-3xl">{h.hookTitle}</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {hooks.map((x) => (
            <div key={x.title} className="card p-7 hover:shadow-lift transition-shadow">
              <span className="grid place-items-center size-12 rounded-2xl bg-accent-soft text-accent">
                <x.icon className="size-5" />
              </span>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">{x.title}</h3>
              <p className="mt-2 text-muted leading-relaxed">{x.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final call to action */}
      <section className="px-4 pb-16">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-ink text-bg px-6 py-16 sm:px-14 sm:py-20">
          <div aria-hidden className="absolute -right-24 -bottom-32 size-[420px] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }} />
          <div className="relative max-w-2xl">
            <h2 className="display text-[44px] sm:text-[60px]">{h.finalTitle}</h2>
            <p className="mt-4 text-lg opacity-70">{h.finalBody}</p>
            <Link href="/login" className="btn mt-9 h-13 px-7 text-base bg-bg text-ink hover:opacity-90">
              {h.ctaBusiness} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-5 pb-10 flex items-center justify-between text-sm text-muted">
        <span className="display text-xl text-ink">{t.appName}</span>
        <span>© {/* static year keeps the page cacheable */}2026</span>
      </footer>
    </div>
  );
}

/** A static picture of the customer booking screen, drawn in HTML so it stays crisp and themed. */
function PhoneMock({ t }: { t: Dict }) {
  const times = ["09:00", "09:30", "10:15", "11:00", "12:30", "14:00", "15:15", "16:45"];
  return (
    <div className="relative w-[300px] sm:w-[330px] rounded-[48px] bg-ink p-3 shadow-lift rotate-[-2deg]">
      <div className="relative overflow-hidden rounded-[38px] bg-bg">
        <div className="absolute left-1/2 top-2.5 -translate-x-1/2 h-6 w-24 rounded-full bg-ink" />
        <div
          className="px-5 pt-12 pb-5"
          style={{ background: "radial-gradient(120% 80% at 0% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%)" }}
        >
          <p className="eyebrow text-[9px]">{t.businessTypes.barber} · Podgorica</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid place-items-center size-11 rounded-2xl bg-accent text-accent-ink display text-2xl">B</span>
            <span className="display text-[26px]">Berbernica Marko</span>
          </div>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-0.5 text-[11px] font-medium text-ok">
            <span className="size-1.5 rounded-full bg-ok" /> {t.book.openNow} · {t.book.until} 20:00
          </span>
        </div>
        <div className="px-3 pb-24 space-y-2.5">
          <div className="card p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center size-5 rounded-full bg-accent text-accent-ink">
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span className="display text-lg">{t.book.chooseService}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="font-medium">Muško šišanje</span>
              <span className="text-muted flex items-center gap-1">
                <Clock className="size-3" />
                30 min · <span className="text-ink font-medium">10 €</span>
              </span>
            </div>
          </div>
          <div className="card p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center size-5 rounded-full border border-line text-[10px] text-muted">2</span>
              <span className="display text-lg">{t.book.chooseTime}</span>
            </div>
            <div className="mt-3 flex gap-1.5">
              {[
                [t.common.today, "17"],
                [t.common.tomorrow, "18"],
                [t.weekdaysShort[0], "19"],
                [t.weekdaysShort[1], "20"],
              ].map(([d, n], i) => (
                <span key={n} className={`flex-1 rounded-xl border py-1.5 text-center ${i === 0 ? "bg-ink text-bg border-ink" : "border-line"}`}>
                  <span className="block text-[8px] font-semibold uppercase tracking-wider opacity-70 truncate">{d}</span>
                  <span className="block text-base font-medium leading-tight">{n}</span>
                </span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {times.map((x, i) => (
                <span
                  key={x}
                  className={`h-8 grid place-items-center rounded-lg border text-[12px] font-medium tabular-nums ${i === 5 ? "bg-accent border-accent text-accent-ink" : "border-line"}`}
                >
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute inset-x-2.5 bottom-2.5 rounded-[24px] bg-ink text-bg p-1.5 pl-4 flex items-center gap-2">
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-[13px] font-medium truncate">Muško šišanje · 10 €</div>
            <div className="text-[11px] opacity-70">{t.common.today} · 14:00 · Marko</div>
          </div>
          <span className="btn-primary h-9 px-3.5 text-[13px]">
            {t.book.confirm.split(" ")[0]} <Check className="size-3.5" />
          </span>
        </div>
      </div>
      <div className="absolute -left-14 top-[47%] hidden sm:flex items-center gap-2 rounded-2xl bg-surface border border-line shadow-lift px-3.5 py-2.5 rotate-[3deg]">
        <Sparkles className="size-4 text-accent" />
        <span className="text-[13px] font-medium">{t.book.welcomeBack}, Ana</span>
      </div>
      <div className="absolute -right-10 bottom-24 hidden sm:flex items-center gap-2 rounded-2xl bg-surface border border-line shadow-lift px-3.5 py-2.5 rotate-[4deg]">
        <Share2 className="size-4 text-accent" />
        <span className="text-[13px] font-medium">{t.book.instantConfirm}</span>
      </div>
    </div>
  );
}
