import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { PhoneMock } from "@/components/PhoneMock";
import { ContactBlock } from "@/components/ContactBlock";
import { getDict } from "@/i18n/server";
import { VERTICALS, verticalBySlug } from "@/lib/verticals";
import { StartLink } from "../../StartLink";
import { RememberVertical } from "../../VerticalMemory";

export function generateStaticParams() {
  return VERTICALS.map((v) => ({ vertical: v.slug }));
}

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
  return (
    <div className="flex-1 flex flex-col overflow-x-clip">
      <RememberVertical slug={v.slug} />
      <header className="mx-auto w-full max-w-3xl px-5 py-5 flex items-center justify-between" style={{ viewTransitionName: "app-header" }}>
        <Link href="/" className="btn-ghost btn-sm -ml-2">
          <ArrowLeft className="size-4" /> {h.allTypes}
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitch current={locale} />
        </div>
      </header>

      <section className="relative mx-auto w-full max-w-3xl px-5 pt-8 pb-12 flex flex-col items-center text-center">
        <div aria-hidden className="absolute -top-40 right-[-20%] size-[640px] max-w-[100vw] rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }} />
        <h1 className="relative display text-[38px] sm:text-[54px] leading-[1.05] animate-rise">{v.headline[locale]}</h1>
        <p className="relative mt-4 max-w-md text-lg text-muted leading-relaxed animate-rise [animation-delay:60ms]">{v.sub[locale]}</p>
        <Link href={v.demo} className="relative mt-7 btn-primary h-13 px-8 text-base animate-rise [animation-delay:120ms]">
          {h.seeDemo} <ArrowRight className="size-4" />
        </Link>
        <StartLink type={v.setupType} className="relative mt-4 text-sm text-muted underline underline-offset-4 hover:text-ink">
          {h.startSelf}
        </StartLink>
        <div className="relative mt-6 h-[400px] sm:h-[460px] flex justify-center animate-rise [animation-delay:180ms]">
          <div className="origin-top scale-[0.72] sm:scale-[0.82]">
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
      </section>

      <section className="mx-auto w-full max-w-3xl px-5 pb-16 text-center">
        <h2 className="display text-[28px] sm:text-[36px]">{h.stepsTitle}</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-3">
          {h.steps.map((step, i) => (
            <li key={step} className="card p-5 flex flex-col items-center gap-3">
              <span className="grid place-items-center size-10 rounded-full bg-accent text-accent-ink display text-lg">{i + 1}</span>
              <span className="font-semibold">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <ContactBlock t={t} />
    </div>
  );
}
