import { Fragment, Suspense, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { HtmlLang } from "@/components/HtmlLang";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { getDict } from "@/i18n/server";
import { CONTACT, CONTACT_LINKS } from "@/lib/contact";
import { VERTICALS } from "@/lib/verticals";
import { slugify } from "@/lib/slug";
import { FeatureTiles } from "./FeatureTiles";
import { FEATURES } from "./features";
import { HomeMore } from "./HomeMore";
import { HOME_MORE } from "./homeEnd";
import { PillHeader } from "./PillHeader";
import { IndustryCarousel, type CarouselCard } from "./IndustryCarousel";
import { brandCss } from "@/lib/brand";

export default function Home() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="flex-1" />}>
        <Landing />
      </Suspense>
    </PageTransition>
  );
}

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

// For visitors from the Termin Instagram bio: one sentence, then a demo for their kind of business.
async function Landing() {
  const { locale, t } = await getDict();
  const h = t.home;
  const cards: CarouselCard[] = [
    ...VERTICALS.map((v) => ({
      slug: v.slug,
      href: `/za/${v.slug}`,
      icon: v.icon,
      title: v.tile.title[locale],
      line: v.tile.line[locale],
      preview: {
        initial: v.mock.initial,
        name: v.mock.name,
        typeLabel: v.mock.typeLabel[locale],
        items: v.mock.items.slice(0, 4).map((it) => ({ name: it.name[locale], meta: it.meta, price: it.price, left: it.left })),
        nextFree: { day: v.mock.pill.day[locale], time: v.mock.pill.time },
        arrive: { kind: v.arrive.kind, caption: v.arrive.caption[locale], handle: v.arrive.handle, link: `termin.me/${slugify(v.mock.name)}` },
      },
    })),
    { slug: "other", href: "/start", icon: "more" as const, title: h.other, line: h.otherLine },
  ];
  // "Vaš posao. Vaši termini. Jednostavno." reads as three beats
  const beats = h.heroTitle.split(/(?<=\.)\s+/);

  return (
    <div className="flex-1 flex flex-col overflow-x-clip">
      <HtmlLang locale={locale} title={h.pageTitle} />
      <PillHeader
        brand={<span className="display text-[23px] lg:text-[26px] tracking-[-0.04em]">{t.appName}</span>}
        sections={[
          { id: "pick", label: HOME_MORE[locale].navIndustries },
          { id: "features", label: HOME_MORE[locale].navFeatures },
          { id: "steps-title", label: HOME_MORE[locale].navSteps },
          { id: "faq-title", label: HOME_MORE[locale].navQuestions },
        ]}
        controls={
          <>
            <LanguageSwitch current={locale} large />
            <Link href="/login" className="btn-secondary btn-sm px-3 min-[360px]:px-3.5 whitespace-nowrap lg:h-10 lg:px-4.5 lg:text-[15px]">
              {t.auth.signIn}
            </Link>
          </>
        }
        cta={
          <Link href="/start" className="btn-primary btn-sm hidden sm:inline-flex whitespace-nowrap lg:h-10 lg:px-5 lg:text-[15px]">
            {t.trial.startTitle}
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 flex flex-col pt-3 sm:pt-6 pb-16">
        <div className="text-center">
          <h1 className="display mx-auto max-w-[15ch] sm:max-w-none text-[clamp(1.85rem,7.4vw,3.3rem)] xl:text-[3.75rem] font-semibold leading-[1.04] tracking-[-0.038em]">
            {beats.map((b, i) => (
              <Fragment key={b}>
                {i > 0 && " "}
                <span className={`enter inline-block ${i === beats.length - 1 ? "text-accent" : ""}`} style={delay(i * 70)}>
                  {b}
                </span>
              </Fragment>
            ))}
          </h1>
          <p className="enter mx-auto mt-3 max-w-[30ch] sm:max-w-none text-[18px] sm:text-[21px] leading-snug text-muted text-balance" style={delay(220)}>
            {h.heroBody}
          </p>
          {/* One clear next step, then the three answers an owner wants first: trial, no card, no commission */}
          <div className="enter mt-6 sm:mt-8 flex flex-col items-center gap-3" style={delay(250)}>
            <Link href="/start" className="btn-primary h-12 px-7 text-[16px]">
              {t.trial.startTitle} <ArrowRight className="size-4" />
            </Link>
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[13.5px] text-muted">
              {h.trust.map((x) => (
                <li key={x} className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-accent" strokeWidth={2.5} /> {x}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section className="mt-6 sm:mt-8" aria-labelledby="pick">
          <h2 id="pick" className="enter display scroll-mt-24 text-balance text-center text-[24px] sm:text-[30px] font-semibold tracking-[-0.02em]" style={delay(280)}>
            {h.pickTitle}
          </h2>

          <div className="enter -mx-5 sm:mx-0" style={delay(320)}>
            <style>{VERTICALS.map((v) => brandCss(v.accent, `[data-accent="${v.slug}"]`)).join("")}</style>
            <IndustryCarousel
              cards={cards}
              labels={{
                example: h.example,
                nextFree: t.book.nextFree,
                open: h.seeHow,
                prev: h.prev,
                next: h.next,
                swipeHint: h.swipeHint,
                placesLeft: t.book.placesLeft,
                booked: h.booked,
                newBooking: h.newBooking,
                yourCalendar: h.yourCalendar,
                ownerSees: h.ownerSees,
                busy: h.busy,
                clientSide: h.clientSide,
                ownerSide: h.ownerSide,
                confirm: h.confirm,
                today: t.common.today,
              }}
            />
          </div>

          {/* Phones: every industry one tap away, without swiping (desktop has the chip row above the cards) */}
          <nav aria-label={h.orPick} className="enter mt-6 text-center lg:hidden" style={delay(420)}>
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-muted">{h.orPick}</p>
            <ul className="mt-3 flex flex-wrap justify-center gap-2">
              {[...VERTICALS.map((v) => ({ href: `/za/${v.slug}`, title: v.tile.title[locale] })), { href: "/start", title: h.other }].map((x) => (
                <li key={x.href}>
                  <Link href={x.href} className="inline-flex h-9 items-center rounded-full border border-line px-3.5 text-[13.5px] font-medium text-ink/85 transition hover:border-accent hover:text-ink hover:bg-glass active:scale-[0.97]">
                    {x.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>
        <FeatureTiles
          title={FEATURES[locale].title}
          items={FEATURES[locale].items}
          mini={FEATURES[locale].mini}
          bookBoth={[FEATURES.me.mini.book, FEATURES.en.mini.book]}
        />
        <HomeMore locale={locale} t={t} />
      </main>

      <footer className="mx-auto w-full max-w-5xl px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line/40 text-sm text-muted">
        <span>
          <span className="display text-[17px] text-ink">{t.appName}</span> · © 2026 ·{" "}
          <Link href="/privacy" className="hover:text-ink">
            {t.book.privacy}
          </Link>
        </span>
        <span className="flex items-center gap-1">
          {t.home.contactTitle}
          <a href={CONTACT_LINKS.instagram} target="_blank" rel="noreferrer" className="btn-ghost btn-sm px-2.5 text-ink">
            @{CONTACT.instagram}
          </a>
          <a href={CONTACT_LINKS.whatsapp} target="_blank" rel="noreferrer" className="btn-ghost btn-sm px-2.5 text-ink">
            <MessageCircle className="size-3.5" /> WhatsApp
          </a>
        </span>
      </footer>
    </div>
  );
}
