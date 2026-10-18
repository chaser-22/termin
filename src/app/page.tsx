import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Bike,
  Check,
  Dumbbell,
  Flower2,
  Globe,
  type LucideIcon,
  MapPinned,
  RotateCcw,
  Scissors,
  Stethoscope,
  Trophy,
  User,
  Users,
  Zap,
} from "lucide-react";
import { getDict } from "@/i18n/server";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import type { BusinessType } from "@/lib/slug";
import { HeroShowcase } from "./HeroShowcase";
import { StartLink } from "./StartLink";

export default function Home() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <Landing />
    </Suspense>
  );
}

// Each card: the business type it starts setup with, and a live demo if there is one
const TYPE_CARDS: { key: "beauty" | "health" | "wellness" | "fitness" | "court" | "rental"; type: BusinessType; icon: LucideIcon; demo?: string }[] = [
  { key: "beauty", type: "barber", icon: Scissors, demo: "/marko" },
  { key: "court", type: "court", icon: Trophy, demo: "/demo-padel" },
  { key: "fitness", type: "fitness", icon: Dumbbell, demo: "/demo-joga" },
  { key: "rental", type: "rental", icon: Bike, demo: "/demo-rent" },
  { key: "health", type: "clinic", icon: Stethoscope },
  { key: "wellness", type: "massage", icon: Flower2 },
];

async function Landing() {
  const { locale, t } = await getDict();
  const h = t.home;
  const modes: { icon: LucideIcon; title: string; body: string; demo: string }[] = [
    { icon: User, title: h.modes.person[0], body: h.modes.person[1], demo: "/marko" },
    { icon: MapPinned, title: h.modes.place[0], body: h.modes.place[1], demo: "/demo-padel" },
    { icon: Users, title: h.modes.class[0], body: h.modes.class[1], demo: "/demo-joga" },
  ];
  const hooks = [
    { icon: RotateCcw, title: h.hook1Title, body: h.hook1Body },
    { icon: BellRing, title: h.hook2Title, body: h.hook2Body },
    { icon: Zap, title: h.hook3Title, body: h.hook3Body },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-x-clip">
      <header className="mx-auto w-full max-w-6xl px-5 py-5 flex items-center justify-between">
        <span className="display text-[24px]">{t.appName}</span>
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
          className="absolute -top-40 right-[-20%] size-[720px] max-w-[100vw] rounded-full opacity-25 blur-3xl dark:opacity-30"
          style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }}
        />
        <HeroShowcase
          top={<p className="eyebrow animate-rise">{h.eyebrow}</p>}
          lead={h.heroLead}
          words={h.heroWords}
          caption={h.demoCaption}
          labels={{
            nextFree: t.book.nextFree,
            today: t.common.today,
            tomorrow: t.common.tomorrow,
            openUntil: `${t.book.openNow} · ${t.book.until} 20:00`,
            chooseService: t.book.chooseService,
            chooseResource: t.book.chooseResource,
            anyResource: t.book.anyResource,
            groupClass: t.book.groupClass,
            placesLeft: t.book.placesLeft,
            lastPlace: t.book.lastPlace,
            welcomeBack: t.book.welcomeBack,
          }}
          bottom={
            <>
              <p className="mt-6 max-w-xl text-lg text-muted leading-relaxed animate-rise [animation-delay:120ms]">{h.heroBody}</p>
              <div className="mt-9 flex flex-wrap gap-3 animate-rise [animation-delay:180ms]">
                <Link href="#start" className="btn-primary h-13 px-7 text-base">
                  {h.ctaBusiness} <ArrowRight className="size-4" />
                </Link>
                <Link href="#types" className="btn-secondary h-13 px-7 text-base">
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
            </>
          }
        />
      </section>

      {/* Who it's for */}
      <section id="types" className="mx-auto w-full max-w-6xl px-5 py-20 scroll-mt-6">
        <p className="eyebrow">{h.forTitle}</p>
        <h2 className="display text-[34px] sm:text-[46px] mt-3 max-w-2xl">{h.forBody}</h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TYPE_CARDS.map(({ key, type, icon: Icon, demo }) => (
            <div key={key} className="card p-6 flex flex-col gap-5 hover:shadow-lift transition-shadow">
              <span className="grid place-items-center size-12 rounded-2xl bg-accent-soft text-accent">
                <Icon className="size-5" />
              </span>
              <div className="flex-1">
                <h3 className="text-lg font-bold tracking-tight">{h.types[key][0]}</h3>
                <p className="mt-1.5 text-muted leading-relaxed">{h.types[key][1]}</p>
              </div>
              <div className="flex gap-2">
                <StartLink type={type} className="btn-primary btn-sm">
                  {h.startThis} <ArrowRight className="size-3.5" />
                </StartLink>
                {demo && (
                  <Link href={demo} className="btn-ghost btn-sm">
                    {h.seeExample}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Three ways to book */}
      <section className="border-y border-[var(--glass-border)] bg-glass backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="display text-[34px] sm:text-[46px] max-w-2xl">{h.modesTitle}</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {modes.map((m) => (
              <Link key={m.title} href={m.demo} className="group block">
                <span className="grid place-items-center size-14 rounded-full bg-accent text-accent-ink transition-transform group-hover:scale-105">
                  <m.icon className="size-6" />
                </span>
                <h3 className="mt-5 text-xl font-bold tracking-tight flex items-center gap-2">
                  {m.title} <ArrowRight className="size-4 opacity-0 -translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0" />
                </h3>
                <p className="mt-2 text-muted leading-relaxed">{m.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why clients come back */}
      <section className="mx-auto w-full max-w-6xl px-5 py-24">
        <h2 className="display text-[34px] sm:text-[46px] max-w-3xl">{h.hookTitle}</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {hooks.map((x) => (
            <div key={x.title} className="card p-7 hover:shadow-lift transition-shadow">
              <span className="grid place-items-center size-12 rounded-2xl bg-accent-soft text-accent">
                <x.icon className="size-5" />
              </span>
              <h3 className="mt-6 text-lg font-bold tracking-tight">{x.title}</h3>
              <p className="mt-2 text-muted leading-relaxed">{x.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tourists */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-24">
        <div className="card p-8 sm:p-12 grid gap-8 md:grid-cols-[1.2fr_1fr] items-center">
          <div>
            <span className="grid place-items-center size-12 rounded-2xl bg-accent-soft text-accent">
              <Globe className="size-5" />
            </span>
            <h2 className="display text-[30px] sm:text-[40px] mt-5">{h.touristTitle}</h2>
            <p className="mt-3 text-muted text-lg leading-relaxed max-w-xl">{h.touristBody}</p>
          </div>
          <ul className="space-y-3">
            {h.touristPoints.map((p) => (
              <li key={p} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 font-semibold">
                <Check className="size-4 text-accent shrink-0" /> {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Final call to action: pick a type, setup starts with it */}
      <section id="start" className="px-4 pb-16 scroll-mt-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-[var(--pill-bg)] text-[var(--pill-fg)] px-6 py-16 sm:px-14 sm:py-20">
          <div aria-hidden className="absolute -right-24 -bottom-32 size-[420px] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }} />
          <div className="relative">
            <h2 className="display text-[34px] sm:text-[52px] max-w-2xl">{h.finalTitle}</h2>
            <p className="mt-4 text-lg opacity-70">{h.finalBody}</p>
            <div className="mt-9 flex flex-wrap gap-2.5">
              {TYPE_CARDS.map(({ key, type, icon: Icon }) => (
                <StartLink
                  key={key}
                  type={type}
                  className="btn h-12 px-5 border border-[color-mix(in_srgb,var(--pill-fg)_20%,transparent)] hover:bg-[var(--pill-fg)] hover:text-[var(--pill-bg)]"
                >
                  <Icon className="size-4" /> {h.types[key][0]}
                </StartLink>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-5 pb-10 flex items-center justify-between text-sm text-muted">
        <span className="display text-xl text-ink">{t.appName}</span>
        <span>© 2026</span>
      </footer>
    </div>
  );
}
