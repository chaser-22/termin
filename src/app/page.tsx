import { Fragment, Suspense, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, MessageCircle } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { VerticalIcon } from "@/components/VerticalIcon";
import { getDict } from "@/i18n/server";
import { CONTACT, CONTACT_LINKS } from "@/lib/contact";
import { VERTICALS } from "@/lib/verticals";
import { ContinueChip } from "./VerticalMemory";
import { Atmosphere } from "./Atmosphere";

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
  // "Vaš posao. Vaši termini. Jednostavno." reads as three beats
  const beats = h.heroTitle.split(/(?<=\.)\s+/);

  return (
    <div className="flex-1 flex flex-col overflow-x-clip">
      <Atmosphere />
      <header className="mx-auto w-full max-w-5xl px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2 flex items-center justify-between gap-3" style={{ viewTransitionName: "app-header" }}>
        <span className="display text-[23px] tracking-[-0.04em]">{t.appName}</span>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/login" className="btn-ghost btn-sm px-3 text-muted">
            {t.auth.signIn}
          </Link>
          <LanguageSwitch current={locale} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 flex flex-col justify-center py-8 sm:py-10">
        <div className="text-center">
          <h1 className="display mx-auto max-w-[15ch] sm:max-w-[22ch] text-[clamp(2.1rem,8.6vw,4.1rem)] font-semibold leading-[1.02] tracking-[-0.038em]">
            {beats.map((b, i) => (
              <Fragment key={b}>
                {i > 0 && " "}
                <span className={`enter inline-block ${i === beats.length - 1 ? "text-accent" : ""}`} style={delay(i * 70)}>
                  {b}
                </span>
              </Fragment>
            ))}
          </h1>
          <p className="enter mx-auto mt-4 sm:mt-5 max-w-[34ch] text-[16.5px] sm:text-lg leading-relaxed text-muted text-balance" style={delay(220)}>
            {h.heroBody}
          </p>
        </div>

        <section className="mt-9 sm:mt-11" aria-labelledby="pick">
          <h2 id="pick" className="enter text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-muted" style={delay(280)}>
            {h.pickTitle}
          </h2>
          <div className="industry-grid mt-4 sm:mt-5 grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-4 gap-2 min-[380px]:gap-2.5 sm:gap-3.5">
            {VERTICALS.map((v, i) => (
              <IndustryCard key={v.slug} href={`/za/${v.slug}`} icon={v.icon} title={v.tile.title[locale]} line={v.tile.line[locale]} index={i} />
            ))}
            <IndustryCard href="/start" icon="more" title={h.other} line={h.otherLine} index={VERTICALS.length} quiet />
          </div>

          <div className="enter mt-5 flex flex-col items-center gap-3" style={delay(560)}>
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

function IndustryCard({
  href,
  icon,
  title,
  line,
  index,
  quiet,
}: {
  href: string;
  icon: Parameters<typeof VerticalIcon>[0]["icon"];
  title: string;
  line: string;
  index: number;
  quiet?: boolean;
}) {
  return (
    <Link
      href={href}
      style={delay(320 + index * 35)}
      className={`industry-card enter group rounded-[22px] min-[380px]:rounded-[24px] border p-3.5 min-[380px]:p-4 sm:p-5 grid grid-cols-[auto_1fr_auto] items-center gap-x-3.5 min-h-[76px] min-[380px]:grid-cols-[1fr_auto] min-[380px]:grid-rows-[auto_1fr] min-[380px]:gap-y-5 min-[380px]:min-h-[140px] sm:min-h-[148px] outline-none ${
        quiet
          ? "border-dashed border-line bg-transparent"
          : "border-[var(--glass-border)] bg-glass backdrop-blur-xl shadow-soft hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--glass-border))]"
      }`}
    >
      <span className="industry-icon grid place-items-center size-11 rounded-2xl bg-accent-soft text-accent ring-1 ring-inset ring-[color-mix(in_srgb,var(--accent)_18%,transparent)] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] min-[380px]:self-start">
        <VerticalIcon icon={icon} className="size-[20px]" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 min-[380px]:col-span-2 min-[380px]:row-start-2 min-[380px]:self-end">
        <span className="block text-[15px] sm:text-[16.5px] font-semibold leading-snug tracking-[-0.01em] text-balance">{title}</span>
        <span className="mt-0.5 min-[380px]:mt-1 block text-[13px] sm:text-[13.5px] leading-snug text-muted">{line}</span>
      </span>
      <span className="industry-arrow grid place-items-center size-7 rounded-full text-muted min-[380px]:col-start-2 min-[380px]:row-start-1 min-[380px]:self-start">
        <ArrowUpRight className="size-4" />
      </span>
    </Link>
  );
}
