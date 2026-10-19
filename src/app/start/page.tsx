import { Suspense } from "react";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { invites } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { db } from "@/lib/server/db";
import { BUSINESS_TYPES, type BusinessType } from "@/lib/slug";
import { VERTICALS } from "@/lib/verticals";
import { brandCss } from "@/lib/brand";
import { StartForm } from "./StartForm";

export const metadata = { title: "Start", robots: { index: false } };

export default function StartPage({ searchParams }: PageProps<"/start">) {
  return (
    <PageTransition>
      <Suspense fallback={<div className="flex-1" />}>
        <Start searchParams={searchParams} />
      </Suspense>
    </PageTransition>
  );
}

async function Start({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { invite: code, type } = await searchParams;
  const { locale, t } = await getDict();
  const invite = typeof code === "string" ? await (await db()).query.invites.findFirst({ where: eq(invites.code, code) }) : undefined;
  const usable = invite && !invite.usedAt ? invite : undefined;
  const defaultType = typeof type === "string" && (BUSINESS_TYPES as readonly string[]).includes(type) ? (type as BusinessType) : undefined;
  const vertical = VERTICALS.find((v) => v.setupType === defaultType);
  const back = vertical?.slug;

  return (
    <div className="flex-1 flex flex-col">
      {vertical && <style>{brandCss(vertical.accent)}</style>}
      <header className="mx-auto w-full max-w-md px-5 py-5 flex items-center justify-between">
        <Link href={usable ? `/p/${usable.code}` : back ? `/za/${back}` : "/"} className="btn-ghost btn-sm -ml-2">
          <ArrowLeft className="size-4" /> {t.common.back}
        </Link>
        <LanguageSwitch current={locale} />
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-5 pt-6 pb-16">
        <StartForm
          invite={usable ? { code: usable.code, name: usable.businessName } : undefined}
          defaultType={defaultType}
          namePlaceholder={vertical?.mock.name ?? "Berbernica Marko"}
          types={[...VERTICALS.map((v) => ({ type: v.setupType, icon: v.icon, label: v.tile.title[locale] })), { type: "other" as const, icon: "more" as const, label: t.businessTypes.other }]}
          t={{ trial: t.trial, common: t.common, auth: t.auth }}
        />
      </main>
    </div>
  );
}
