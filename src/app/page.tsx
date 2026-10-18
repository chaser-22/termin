import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, CalendarCheck2, Check, Clock, QrCode, RotateCcw, Share2, Sparkles, Store, Zap } from "lucide-react";
import { getDict } from "@/i18n/server";
import type { Dict } from "@/i18n/dict";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Odometer } from "@/components/Odometer";

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
            <h1 className="display text-[40px] sm:text-[56px] lg:text-[66px] mt-5 animate-rise [animation-delay:60ms]">
              {h.heroLead} <span className="text-accent">{h.heroItalic}</span>
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
        <h2 className="display text-[34px] sm:text-[46px] max-w-3xl">{h.hookTitle}</h2>
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
            <h2 className="display text-[34px] sm:text-[46px]">{h.finalTitle}</h2>
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

/** A static picture of the customer booking screen (Čistina), drawn in HTML so it stays crisp and themed. */
function PhoneMock({ t }: { t: Dict }) {
  const tiles: [string, string, string][] = [
    ["Muško šišanje", "30 min", "10 €"],
    ["Šišanje i brada", "45 min", "15 €"],
    ["Uređivanje brade", "15 min", "5 €"],
    ["Dječije šišanje", "20 min", "7 €"],
  ];
  return (
    <div className="relative w-[300px] sm:w-[330px] rounded-[48px] bg-[#0c0d0d] p-3 shadow-lift rotate-[-2deg]">
      <div className="relative overflow-hidden rounded-[38px] bg-bg">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "repeating-radial-gradient(ellipse at 80% 10%, transparent 0 16px, var(--contour) 16px 17px), radial-gradient(80% 40% at 50% 0%, var(--bg-top), transparent 70%)" }}
        />
        <div className="absolute left-1/2 top-2.5 -translate-x-1/2 h-6 w-24 rounded-full bg-[#0c0d0d]" />
        <div className="relative px-4 pt-12 pb-24 flex flex-col items-center text-center">
          <span className="grid place-items-center size-14 rounded-full bg-accent text-accent-ink display text-2xl shadow-[0_0_0_5px_var(--glass)]">B</span>
          <p className="eyebrow text-[8.5px] mt-4">{t.businessTypes.barber} · Kotor</p>
          <p className="display text-[27px] mt-1.5">Berbernica Marko</p>
          <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-glass border border-[var(--glass-border)] px-2.5 py-1 text-[10.5px] font-semibold text-ok">
            <span className="size-1.5 rounded-full bg-ok" /> {t.book.openNow} · {t.book.until} 20:00
          </span>
          <div className="mt-4 grid w-full grid-cols-2 gap-2 text-left">
            {tiles.map(([name, dur, price]) => (
              <div key={name} className="card rounded-[18px] p-3 flex flex-col gap-4">
                <span className="text-[12px] font-semibold leading-tight">{name}</span>
                <span className="flex justify-between text-[10px] text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {dur}
                  </span>
                  <span className="text-ink font-bold text-[11px]">{price}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-x-2.5 bottom-2.5 rounded-full bg-[var(--pill-bg)] text-[var(--pill-fg)] p-1.5 pl-4 flex items-center gap-2">
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-[8.5px] font-semibold uppercase tracking-[0.14em] opacity-60">{t.book.nextFree}</div>
            <div className="text-[10.5px] opacity-80 truncate">{t.common.today} · Muško šišanje</div>
          </div>
          <Odometer value="14:00" className="display text-[22px] text-[var(--pill-time)]" />
          <span className="grid place-items-center size-9 rounded-full bg-accent text-accent-ink">
            <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
      <div className="absolute -left-16 top-[20%] hidden sm:flex items-center gap-2 rounded-2xl card px-3.5 py-2.5 rotate-[3deg]">
        <Sparkles className="size-4 text-accent" />
        <span className="text-[13px] font-semibold">{t.book.welcomeBack}, Ana</span>
      </div>
      <div className="absolute -right-10 bottom-24 hidden sm:flex items-center gap-2 rounded-2xl card px-3.5 py-2.5 rotate-[4deg]">
        <Share2 className="size-4 text-accent" />
        <span className="text-[13px] font-semibold">{t.book.instantConfirm}</span>
      </div>
    </div>
  );
}
