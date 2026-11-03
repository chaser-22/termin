import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { getDict } from "@/i18n/server";
import { CONTACT } from "@/lib/contact";
import { OPERATOR, PRIVACY, UPDATED } from "./content";

export const metadata = { title: "Privatnost · Privacy" };

export default function PrivacyPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="flex-1" />}>
        <Privacy />
      </Suspense>
    </PageTransition>
  );
}

async function Privacy() {
  const { locale, t } = await getDict();
  const p = PRIVACY[locale];
  const updated = new Intl.DateTimeFormat(locale === "me" ? "sr-Latn-ME" : "en-GB", { dateStyle: "long" }).format(new Date(`${UPDATED}T12:00:00Z`));
  return (
    <div className="flex-1 flex flex-col">
      <header className="mx-auto w-full max-w-2xl px-5 py-4 flex items-center justify-between gap-3">
        <Link href="/" className="btn-ghost btn-sm -ml-2">
          <ArrowLeft className="size-4" /> {t.appName}
        </Link>
        <LanguageSwitch current={locale} />
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pt-4 pb-16">
        <h1 className="display text-[34px] sm:text-[44px]">{p.title}</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-muted">{p.intro}</p>
        <p className="mt-2 text-sm text-muted">
          {p.updated}: {updated}
        </p>

        <div className="mt-8 space-y-4">
          {p.sections.map((s) => (
            <section key={s.title} className="card p-5 sm:p-6">
              <h2 className="text-lg font-semibold tracking-tight">{s.title}</h2>
              {s.items && (
                <ul className="mt-3 space-y-2 text-[15px] leading-relaxed">
                  {s.items.map((x) => (
                    <li key={x} className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              )}
              {s.paragraphs?.map((x) => (
                <p key={x} className="mt-3 text-[15px] leading-relaxed">
                  {x}
                </p>
              ))}
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-[26px] border border-line p-5 sm:p-6">
          <p className="font-semibold">{OPERATOR.name}</p>
          {OPERATOR.address && <p className="text-muted">{OPERATOR.address}</p>}
          <a href={`mailto:${CONTACT.email}`} className="mt-2 inline-flex items-center gap-2 font-medium text-accent">
            <Mail className="size-4" /> {CONTACT.email}
          </a>
        </section>
      </main>
    </div>
  );
}
