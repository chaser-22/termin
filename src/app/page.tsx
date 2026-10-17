import { Suspense } from "react";
import Link from "next/link";
import { getDict } from "@/i18n/server";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export default function Home() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <Landing />
    </Suspense>
  );
}

async function Landing() {
  const { locale, t } = await getDict();
  const points = [
    [t.home.point1Title, t.home.point1Body],
    [t.home.point2Title, t.home.point2Body],
    [t.home.point3Title, t.home.point3Body],
  ];
  return (
    <div className="flex-1 flex flex-col">
      <header className="mx-auto w-full max-w-5xl px-5 py-5 flex items-center justify-between">
        <span className="font-semibold tracking-tight text-lg">{t.appName}</span>
        <div className="flex items-center gap-3">
          <LanguageSwitch current={locale} />
          <Link href="/login" className="btn-secondary btn-sm">{t.auth.signIn}</Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-5 pt-12 pb-20 flex-1">
        <h1 className="max-w-3xl text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">{t.home.heroTitle}</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">{t.home.heroBody}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="btn-primary h-12 px-6">{t.home.ctaBusiness}</Link>
          <Link href="/marko" className="btn-secondary h-12 px-6">{t.home.ctaDemo}</Link>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {points.map(([title, body]) => (
            <div key={title} className="card p-5">
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
