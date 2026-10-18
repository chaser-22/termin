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
          <Link href="/login" className="btn-secondary btn-sm">
            {t.auth.signIn}
          </Link>
        </div>
      </header>

      <section className="relative mx-auto w-full max-w-3xl px-5 pt-10 pb-20 flex flex-col items-center gap-12 text-center">
        <div aria-hidden className="absolute -top-40 right-[-20%] size-[640px] max-w-[100vw] rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }} />
        <div className="relative">
          <p className="eyebrow animate-rise">{v.tile.title[locale]}</p>
          <h1 className="display text-[38px] sm:text-[54px] mt-4 animate-rise [animation-delay:60ms]">{v.headline[locale]}</h1>
          <p className="mt-6 mx-auto max-w-xl text-lg text-muted leading-relaxed animate-rise [animation-delay:120ms]">{v.sub[locale]}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3 animate-rise [animation-delay:180ms]">
            <StartLink type={v.setupType} className="btn-primary h-13 px-7 text-base">
              {h.startSelf} <ArrowRight className="size-4" />
            </StartLink>
            <Link href={v.demo} className="btn-secondary h-13 px-7 text-base">
              {h.seeDemo}
            </Link>
          </div>
          <a href="#kontakt" className="mt-5 inline-block text-sm text-muted underline underline-offset-4 hover:text-ink">
            {h.contactTitle}
          </a>
        </div>
        <div className="relative flex flex-col items-center gap-4 animate-rise [animation-delay:200ms]">
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
          <p className="text-sm text-muted">{h.demoCaption}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-5 pb-20 text-center">
        <h2 className="display text-[30px] sm:text-[42px]">{h.problemsTitle}</h2>
        <div className="mt-8 grid gap-3 stagger">
          {v.pains.map((p) => (
            <div key={p.title.en} className="card p-7">
              <h3 className="text-lg font-bold tracking-tight">{p.title[locale]}</h3>
              <p className="mt-2 text-muted leading-relaxed">{p.body[locale]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-5 pb-20 text-center">
        <h2 className="display text-[30px] sm:text-[42px]">{h.stepsTitle}</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3">
          {h.steps.map(([title, body], i) => (
            <li key={title} className="flex flex-col items-center">
              <span className="grid place-items-center size-11 rounded-full bg-accent text-accent-ink display text-lg">{i + 1}</span>
              <h3 className="mt-4 text-lg font-bold tracking-tight">{title}</h3>
              <p className="mt-1.5 text-muted leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <ContactBlock t={t} setupType={v.setupType} />
    </div>
  );
}
