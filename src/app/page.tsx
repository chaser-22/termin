import { Fragment, Suspense, type CSSProperties } from "react";
import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { getDict } from "@/i18n/server";
import { CONTACT, CONTACT_LINKS } from "@/lib/contact";
import { VERTICALS } from "@/lib/verticals";
import { ContinueChip } from "./VerticalMemory";
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

// For visitors from the Termin Instagram bio: one sentence, then "what's your business?".
async function Landing() {
  const { locale, t } = await getDict();
  const h = t.home;
  const titles = Object.fromEntries(VERTICALS.map((v) => [v.slug, v.tile.title[locale]]));
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
      },
    })),
    { slug: "other", href: "/start", icon: "more" as const, title: h.other, line: h.otherLine },
  ];
  // "Vaš posao. Vaši termini. Jednostavno." reads as three beats
  const beats = h.heroTitle.split(/(?<=\.)\s+/);

  return (
    <div className="flex-1 flex flex-col overflow-x-clip">
      <header className="mx-auto w-full max-w-5xl px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2 flex items-center justify-between gap-3" style={{ viewTransitionName: "app-header" }}>
        <span className="display text-[23px] tracking-[-0.04em]">{t.appName}</span>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/login" className="btn-ghost btn-sm px-3 text-muted">
            {t.auth.signIn}
          </Link>
          <LanguageSwitch current={locale} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 flex flex-col pt-3 sm:pt-6 pb-10">
        <div className="text-center">
          <h1 className="display mx-auto max-w-[15ch] sm:max-w-none text-[clamp(1.85rem,7.4vw,3.3rem)] font-semibold leading-[1.04] tracking-[-0.038em]">
            {beats.map((b, i) => (
              <Fragment key={b}>
                {i > 0 && " "}
                <span className={`enter inline-block ${i === beats.length - 1 ? "text-accent" : ""}`} style={delay(i * 70)}>
                  {b}
                </span>
              </Fragment>
            ))}
          </h1>
          <p className="enter mx-auto mt-2.5 sm:mt-3 max-w-[34ch] sm:max-w-none text-[15.5px] sm:text-[17px] leading-relaxed text-muted text-balance" style={delay(220)}>
            {h.heroBody}
          </p>
        </div>

        <section className="mt-5 sm:mt-7" aria-labelledby="pick">
          <h2 id="pick" className="enter text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-muted" style={delay(280)}>
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
              }}
            />
          </div>

          {/* Every industry one tap away, without swiping */}
          <nav aria-label={h.orPick} className="enter mt-6 text-center" style={delay(420)}>
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

          <div className="enter mt-6 flex flex-col items-center gap-3" style={delay(480)}>
            <ContinueChip label={h.continueAs} titles={titles} />
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[13.5px] text-muted">
              {h.trust.map((x) => (
                <li key={x} className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-accent" strokeWidth={2.5} /> {x}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line/40 text-sm text-muted">
        <span>
          <span className="display text-[17px] text-ink">{t.appName}</span> · © 2026
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
