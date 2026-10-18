import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

async function Landing() {
  const { locale, t } = await getDict();
  const h = t.home;
  const titles = Object.fromEntries(VERTICALS.map((v) => [v.slug, v.tile.title[locale]]));
  return (
    <div className="flex-1 flex flex-col overflow-x-clip">
      <header className="mx-auto w-full max-w-3xl px-5 py-5 flex items-center justify-between" style={{ viewTransitionName: "app-header" }}>
        <span className="display text-[24px]">{t.appName}</span>
        <div className="flex items-center gap-3">
          <LanguageSwitch current={locale} />
          <Link href="/login" className="btn-secondary btn-sm">
            {t.auth.signIn}
          </Link>
        </div>
      </header>

      <section className="relative mx-auto w-full max-w-3xl px-5 pt-12 pb-10 text-center">
        <div aria-hidden className="absolute -top-40 right-[-20%] size-[640px] max-w-[100vw] rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }} />
        <div className="relative">
          <p className="eyebrow animate-rise">{h.eyebrow}</p>
          <h1 className="display text-[38px] sm:text-[56px] mt-4 animate-rise [animation-delay:60ms]">{h.heroTitle}</h1>
          <p className="mt-5 text-lg text-muted leading-relaxed animate-rise [animation-delay:120ms]">{h.heroBody}</p>
          <div className="mt-6 min-h-9 flex justify-center">
            <ContinueChip label={h.continueAs} titles={titles} />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-5 pb-20">
        <h2 className="display text-center text-[26px] sm:text-[34px]">{h.pickTitle}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 stagger">
          {VERTICALS.map((v) => (
            <Link key={v.slug} href={`/za/${v.slug}`} className="card card-interactive group p-6 flex items-center gap-4">
              <span className="grid place-items-center size-12 shrink-0 rounded-2xl bg-accent-soft text-accent">
                <VerticalIcon icon={v.icon} className="size-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-lg font-bold tracking-tight">{v.tile.title[locale]}</span>
                <span className="block text-sm text-muted">{v.tile.line[locale]}</span>
              </span>
              <ArrowRight className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
            </Link>
          ))}
        </div>
      </section>

      <ContactBlock t={t} />

      <footer className="mx-auto w-full max-w-3xl px-5 pb-10 flex items-center justify-between text-sm text-muted">
        <span className="display text-xl text-ink">{t.appName}</span>
        <span>© 2026</span>
      </footer>
    </div>
  );
}
