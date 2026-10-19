import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { PhoneMock } from "@/components/PhoneMock";
import { ContactBlock } from "@/components/ContactBlock";
import { businesses } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { brandCss } from "@/lib/brand";
import { db } from "@/lib/server/db";
import { termsFor } from "@/lib/terms";
import { VERTICALS, verticalBySlug } from "@/lib/verticals";
import { StartLink } from "../../StartLink";
import { RememberVertical } from "../../VerticalMemory";

export function generateStaticParams() {
  return VERTICALS.map((v) => ({ vertical: v.slug }));
}

// One page per industry, for links sent in Instagram DMs. Everything on it is
// about that industry: its words, its services, its example booking page.
export default function VerticalPage({ params }: PageProps<"/za/[vertical]">) {
  return (
    <PageTransition>
      <Suspense fallback={<div className="flex-1" />}>
        <Landing params={params} />
      </Suspense>
    </PageTransition>
  );
}

async function Landing({ params }: { params: Promise<{ vertical: string }> }) {
  const v = verticalBySlug((await params).vertical);
  if (!v) notFound();
  const { locale, t } = await getDict();
  const h = t.home;
  const terms = termsFor(v.setupType);
  // The live example runs on the demo business, when this environment has it
  const demo = await (await db()).query.businesses.findFirst({ where: eq(businesses.slug, v.demo.slice(1)), columns: { id: true } });
  const steps = [
    { title: terms.setUp[locale], body: h.stepSetupSub },
    { title: h.stepShare.replace("{with}", terms.withAudience[locale]), body: h.stepShareSub },
    { title: h.stepBook, body: h.stepBookSub },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-x-clip">
      <style>{brandCss(v.accent)}</style>
      <RememberVertical slug={v.slug} />
      <header className="mx-auto w-full max-w-5xl px-5 py-4 flex items-center justify-between gap-2" style={{ viewTransitionName: "app-header" }}>
        <Link href="/" className="btn-ghost btn-sm -ml-2 min-w-0">
          <ArrowLeft className="size-4 shrink-0" /> <span className="truncate">{h.allTypes}</span>
        </Link>
        <LanguageSwitch current={locale} />
      </header>

      {/* 1. Is this for me? */}
      <section className="relative mx-auto w-full max-w-3xl px-5 pt-6 sm:pt-12 pb-10 text-center">
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[560px] max-w-[100vw] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }} />
        <p className="relative eyebrow text-accent animate-rise">{v.tile.title[locale]}</p>
        <h1 className="relative display mt-3 text-[34px] sm:text-[54px] leading-[1.05] text-balance animate-rise [animation-delay:60ms]">{v.headline[locale]}</h1>
        <p className="relative mx-auto mt-4 max-w-xl text-[17px] sm:text-lg text-muted text-balance animate-rise [animation-delay:120ms]">{v.sub[locale]}</p>
        <div className="relative mt-7 flex flex-col items-center gap-3 animate-rise [animation-delay:180ms]">
          <a href="#primjer" className="btn-primary h-13 px-8 text-base">
            {h.seeHow} <ArrowDown className="size-4" />
          </a>
          <p className="text-sm text-muted">{t.trial.reassurance}</p>
        </div>
      </section>

      {/* 2. What will my clients see? A real booking page, in example mode */}
      <section id="primjer" className="scroll-mt-4 px-5 pb-14 flex flex-col items-center">
        <div className="relative w-[320px] max-w-full rounded-[46px] bg-gradient-to-b from-[#2b2e2e] to-[#0c0d0d] p-2.5 shadow-lift ring-1 ring-white/10">
          <div className="absolute left-1/2 top-4 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-[#0c0d0d]" />
          {demo ? (
            <iframe src={`${v.demo}?preview=1`} title={v.mock.name} loading="lazy" className="block h-[600px] w-full rounded-[37px] bg-bg pt-6" />
          ) : (
            // No demo business in this environment: a drawn picture instead
            <div className="h-[600px] overflow-hidden rounded-[37px]">
              <div className="origin-top-left scale-[0.94]">
                <PhoneMock
                  mock={v.mock}
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
          )}
        </div>
        <p className="mt-4 text-sm text-muted text-center">{demo ? h.tryIt.replace("{as}", terms.asClient[locale]) : h.demoCaption}</p>
      </section>

      {/* 3. How do I start? */}
      <section className="mx-auto w-full max-w-4xl px-5 pb-14">
        <h2 className="display text-center text-[26px] sm:text-[34px]">{h.stepsTitle}</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="card p-5">
              <span className="grid place-items-center size-9 rounded-full bg-accent text-accent-ink font-bold">{i + 1}</span>
              <h3 className="mt-4 font-semibold leading-snug">{s.title}</h3>
              <p className="mt-1 text-sm text-muted leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. Try it */}
      <section className="mx-auto w-full max-w-xl px-5 pb-14 text-center">
        <StartLink type={v.setupType} className="btn-primary w-full h-14 text-base">
          {h.tryFree} <ArrowRight className="size-4" />
        </StartLink>
        <p className="mt-3 text-sm text-muted">{h.noCommit}</p>
      </section>

      <ContactBlock t={t} />
    </div>
  );
}
