import { Suspense } from "react";
import Link from "next/link";
import { getDict } from "@/i18n/server";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Prijava" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex-1 grid place-items-center px-4 py-12">
      <Suspense fallback={<div className="w-full max-w-sm h-80 rounded-2xl bg-surface-2 animate-pulse" />}>
        <Login searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Login({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { error } = await searchParams;
  const { locale, t } = await getDict();
  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="font-semibold tracking-tight text-lg">{t.appName}</Link>
        <LanguageSwitch current={locale} />
      </div>
      <div className="card p-6">
        <h1 className="text-xl font-semibold tracking-tight">{t.auth.loginTitle}</h1>
        <p className="mt-1.5 text-sm text-muted">{t.auth.loginBody}</p>
        {error && <p className="mt-4 rounded-xl bg-danger-soft text-danger text-sm px-3.5 py-2.5">{t.auth.invalidLink}</p>}
        <LoginForm t={{ auth: t.auth, common: t.common }} />
      </div>
    </div>
  );
}
