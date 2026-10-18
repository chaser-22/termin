import { Suspense } from "react";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { businesses } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { logout } from "@/app/actions";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { requireUser } from "@/lib/server/auth";
import { brandCss } from "@/lib/brand";
import { db } from "@/lib/server/db";
import { DashNav } from "./DashNav";

export const metadata = { title: "Dashboard", robots: { index: false } };

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex-1 flex flex-col">
      <Suspense fallback={<div className="h-14 border-b border-line bg-surface" />}>
        <TopBar />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}

async function TopBar() {
  const user = await requireUser();
  const { locale, t } = await getDict();
  const d = await db();
  const business = await d.query.businesses.findFirst({ where: eq(businesses.ownerId, user.id) });
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur-xl">
      {business && <style>{brandCss(business.brandColor)}</style>}
      <div className="mx-auto max-w-6xl px-4 py-2 sm:py-0 sm:h-14 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <Link href="/dashboard" className="display text-[18px] truncate max-w-64 h-10 sm:h-auto flex items-center">
          {business?.name ?? t.appName}
        </Link>
        {business && (
          <DashNav
            className="order-last w-full sm:order-none sm:w-auto"
            items={[
              { href: "/dashboard", label: t.dash.calendar },
              { href: "/dashboard/services", label: t.dash.services },
              { href: "/dashboard/staff", label: t.dash.staff },
              { href: "/dashboard/settings", label: t.dash.settings },
            ]}
          />
        )}
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitch current={locale} />
          <form action={logout}>
            <button className="btn-ghost btn-sm">{t.auth.logout}</button>
          </form>
        </div>
      </div>
    </header>
  );
}
