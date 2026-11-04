import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { Dict, Locale } from "@/i18n/dict";
import { CONTACT_LINKS } from "@/lib/contact";
import { HOME_MORE } from "./homeEnd";

const heading = "display text-center text-[24px] sm:text-[30px] font-semibold tracking-[-0.02em]";

// After the demo and the feature tiles: how to start in three steps, the
// questions owners ask before signing up, and one last way in. These stay in
// the Termin colour (teal); only the demo above wears the industry's colour.
export function HomeMore({ locale, t }: { locale: Locale; t: Dict }) {
  const h = t.home;
  const m = HOME_MORE[locale];
  const steps = [
    { title: m.steps[0], body: h.stepSetupSub },
    { title: m.steps[1], body: h.stepShareSub },
    { title: h.stepBook, body: h.stepBookSub },
  ];

  return (
    <>
      <section aria-labelledby="steps-title" className="mx-auto mt-20 w-full max-w-5xl">
        <h2 id="steps-title" className={`${heading} scroll-mt-24`}>
          {h.stepsTitle}
        </h2>
        <ol className="mt-6 grid gap-2.5 sm:grid-cols-3 sm:gap-3">
          {steps.map((s, i) => (
            <li key={s.title} className="card p-5 sm:p-6">
              <span className="grid size-9 place-items-center rounded-full bg-accent font-bold text-accent-ink">{i + 1}</span>
              <h3 className="mt-4 text-[16px] font-semibold leading-snug tracking-[-0.01em]">{s.title}</h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="faq-title" className="mx-auto mt-20 w-full max-w-3xl">
        <h2 id="faq-title" className={`${heading} scroll-mt-24`}>
          {m.faqTitle}
        </h2>
        <div className="mt-6 space-y-2">
          {m.faq.map((f) => (
            <details key={f.q} className="group card px-5 sm:px-6 [&>summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] sm:text-[16px] font-semibold leading-snug">
                {f.q}
                <ChevronDown className="size-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <p className="-mt-1 pb-5 text-[14px] sm:text-[15px] leading-relaxed text-muted">
                {f.a}
                {f.privacy && (
                  <>
                    {" "}
                    <Link href="/privacy" className="text-ink underline underline-offset-4 hover:text-accent">
                      {m.privacyMore}
                    </Link>
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="card relative mx-auto mt-20 w-full max-w-5xl overflow-hidden px-6 py-12 text-center sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-48 left-1/2 size-[560px] max-w-full -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }}
        />
        <h2 className="display relative text-[26px] sm:text-[38px] font-semibold leading-tight tracking-[-0.025em] text-balance">{h.tryFree}</h2>
        <p className="relative mt-2 text-[15px] sm:text-[17px] text-muted">{h.noCommit}</p>
        <Link href="/start" className="btn-primary relative mt-7 h-12 px-7 text-[16px]">
          {t.trial.startTitle} <ArrowRight className="size-4" />
        </Link>
        <p className="relative mt-5 text-[14px]">
          <a href={CONTACT_LINKS.instagram} target="_blank" rel="noreferrer" className="text-muted underline-offset-4 hover:text-ink hover:underline">
            {m.setUpForYou}
          </a>
        </p>
      </section>
    </>
  );
}
