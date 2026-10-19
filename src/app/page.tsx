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

export default function Home() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="flex-1" />}>
        <Landing />
      </Suspense>
    </PageTransition>
  );
}

// For visitors from the Termin Instagram bio: one sentence, then "what's your business?".
async function Landing() {
  const { locale, t } = await getDict();
  const h = t.home;
  const titles = Object.fromEntries(VERTICALS.map((v) => [v.slug, v.tile.title[locale]]));
  return (
    <div className="flex-1 flex flex-col overflow-x-clip">
      <header className="mx-auto w-full max-w-5xl px-5 py-4 flex items-center justify-between gap-3" style={{ viewTransitionName: "app-header" }}>
        <span className="display text-[24px]">{t.appName}</span>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/login" className="btn-ghost btn-sm text-muted">
            {t.auth.signIn}
          </Link>
          <LanguageSwitch current={locale} />
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-5xl flex-1 px-5 pt-6 sm:pt-12 pb-16">
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[560px] max-w-[100vw] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }} />

        <div className="relative text-center">
          <h1 className="display mx-auto max-w-3xl text-[34px] sm:text-[56px] leading-[1.04] text-balance animate-rise">{h.heroTitle}</h1>
          <p className="mx-auto mt-4 max-w-xl text-[17px] sm:text-lg text-muted text-balance animate-rise [animation-delay:60ms]">{h.heroBody}</p>
        </div>

        <section className="relative mt-9 sm:mt-12" aria-labelledby="pick">
          <h2 id="pick" className="text-center text-[15px] font-semibold animate-rise [animation-delay:100ms]">
            {h.pickTitle}
          </h2>
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 stagger">
            {VERTICALS.map((v) => (
              <Tile key={v.slug} href={`/za/${v.slug}`} icon={v.icon} title={v.tile.title[locale]} line={v.tile.line[locale]} />
            ))}
            <Tile href="/start" icon="more" title={h.other} line={h.otherLine} quiet />
          </div>
          <div className="mt-4 min-h-9 flex justify-center">
            <ContinueChip label={h.continueAs} titles={titles} />
          </div>
          <ul className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-muted">
            {h.trust.map((x) => (
              <li key={x} className="flex items-center gap-1.5">
                <Check className="size-4 text-accent" /> {x}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <ContactBlock t={t} />

      <footer className="mx-auto w-full max-w-5xl px-5 pb-10 flex items-center justify-between text-sm text-muted">
        <span className="display text-xl text-ink">{t.appName}</span>
        <span>© 2026</span>
      </footer>
    </div>
  );
}

function Tile({ href, icon, title, line, quiet }: { href: string; icon: Parameters<typeof VerticalIcon>[0]["icon"]; title: string; line: string; quiet?: boolean }) {
  return (
    <Link
      href={href}
      className={`card card-interactive group relative min-h-[132px] p-4 sm:p-5 flex flex-col justify-between gap-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${quiet ? "bg-transparent" : ""}`}
    >
      <span className="flex items-start justify-between">
        <span className="grid place-items-center size-11 rounded-2xl bg-accent-soft text-accent transition-transform duration-300 group-hover:scale-105">
          <VerticalIcon icon={icon} className="size-5" />
        </span>
        <ArrowRight className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
      </span>
      <span>
        <span className="block font-semibold leading-snug text-[15px] sm:text-base">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-muted">{line}</span>
      </span>
    </Link>
  );
}
