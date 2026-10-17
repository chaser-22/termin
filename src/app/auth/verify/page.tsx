import { Suspense } from "react";
import { confirmLogin } from "@/app/actions";
import { getDict } from "@/i18n/server";

export const metadata = { title: "Prijava", robots: { index: false } };

// The emailed link lands here; signing in needs a click, so email security
// scanners that open links automatically don't use up the one-time token.
export default function VerifyPage({ searchParams }: PageProps<"/auth/verify">) {
  return (
    <main className="flex-1 grid place-items-center px-4 py-12">
      <Suspense fallback={<div className="w-full max-w-sm h-48 rounded-2xl bg-surface-2 animate-pulse" />}>
        <Verify searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Verify({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await searchParams;
  const { t } = await getDict();
  if (typeof token !== "string" || !token) {
    return <p className="card p-6 w-full max-w-sm text-center text-muted">{t.auth.invalidLink}</p>;
  }
  return (
    <form action={confirmLogin.bind(null, token)} className="card p-6 w-full max-w-sm space-y-4 text-center">
      <h1 className="text-xl font-semibold tracking-tight">{t.auth.continueTitle}</h1>
      <button className="btn-primary w-full">{t.auth.continueButton}</button>
    </form>
  );
}
