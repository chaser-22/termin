import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { VerticalIcon } from "@/components/VerticalIcon";
import { ContactBlock } from "@/components/ContactBlock";
import { getDict } from "@/i18n/server";
import { VERTICALS } from "@/lib/verticals";
import { ContinueChip } from "./VerticalMemory";
import { HeroPhone } from "./HeroPhone";
import { LaptopMock } from "./LaptopMock";

export default function Home() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="flex-1" />}>
        <Landing />
      </Suspense>
    </PageTransition>
  );
}

async function Landing() {
  const { locale, t } = await getDict();
  const h = t.home;
  const titles = Object.fromEntries(VERTICALS.map((v) => [v.slug, v.tile.title[locale]]));
  return (
    <div className="flex-1 flex flex-col overflow-x-clip">
      <header className="mx-auto w-full max-w-6xl px-5 py-5 flex items-center justify-between" style={{ viewTransitionName: "app-header" }}>
        <span className="display text-[24px]">{t.appName}</span>
        <LanguageSwitch current={locale} />
      </header>

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-5 pt-6 pb-16 grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div aria-hidden className="absolute -top-32 right-[-10%] size-[620px] max-w-[100vw] rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }} />

        {/* Left: what it is, and pick your business */}
        <div className="relative text-center lg:text-left">
          <h1 className="display text-[44px] sm:text-[60px] leading-[1.02] animate-rise">{h.heroTitle}</h1>
          <p className="mt-4 text-lg text-muted animate-rise [animation-delay:60ms]">{h.heroBody}</p>
          <ul className="mt-4 flex flex-wrap justify-center lg:justify-start gap-x-4 gap-y-1 text-sm font-medium animate-rise [animation-delay:120ms]">
            {h.trust.map((x) => (
              <li key={x} className="flex items-center gap-1.5">
                <Check className="size-4 text-accent" /> {x}
              </li>
            ))}
          </ul>

          <p className="mt-10 text-sm font-semibold text-muted animate-rise [animation-delay:160ms]">{h.pickTitle}</p>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 stagger">
            {VERTICALS.map((v) => (
              <Link key={v.slug} href={`/za/${v.slug}`} className="card card-interactive group px-3 py-4 flex flex-col items-center gap-2.5">
                <span className="grid place-items-center size-11 rounded-2xl bg-accent-soft text-accent transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <VerticalIcon icon={v.icon} className="size-5" />
                </span>
                <span className="font-semibold text-[15px]">{v.tile.title[locale]}</span>
              </Link>
            ))}
          </div>
          <div className="mt-5 min-h-9 flex justify-center lg:justify-start">
            <ContinueChip label={h.continueAs} titles={titles} />
          </div>
        </div>

        {/* Right: what the owner sees, and what clients see */}
        <div className="relative flex justify-center lg:justify-end pb-6 animate-rise [animation-delay:200ms]">
          <div className="w-full max-w-[600px] pl-[24%] sm:pl-[26%]">
            <LaptopMock locale={locale} labels={{ today: t.common.today, newBooking: t.dash.newBooking, people: ["Marko", "Ana"] }} />
          </div>
          <div className="absolute left-0 lg:left-[2%] -bottom-2 w-[150px] sm:w-[180px] h-[300px] sm:h-[360px] animate-float">
            <div className="origin-top-left scale-[0.5] sm:scale-[0.56]">
              <HeroPhone
                mocks={VERTICALS.map((v) => v.mock)}
                locale={locale}
                labels={{
                  nextFree: t.book.nextFree,
                  openUntil: `${t.book.openNow} · ${t.book.until} 20:00`,
                  chooseResource: t.book.chooseResource,
                  anyResource: t.book.anyResource,
                  groupClass: t.book.groupClass,
                  placesLeft: t.book.placesLeft,
                  lastPlace: t.book.lastPlace,
                }}
              />
            </div>
          </div>
        </div>
      </main>

      <ContactBlock t={t} />

      <footer className="mx-auto w-full max-w-6xl px-5 pb-10 flex items-center justify-between text-sm text-muted">
        <span className="display text-xl text-ink">{t.appName}</span>
        <Link href="/login" className="hover:text-ink">
          {t.auth.signIn} <ArrowRight className="inline size-3.5" />
        </Link>
      </footer>
    </div>
  );
}
