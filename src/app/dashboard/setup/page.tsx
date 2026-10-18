import { Suspense } from "react";
import { PageTransition } from "@/components/PageTransition";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { businesses } from "@/db/schema";
import { db } from "@/lib/server/db";
import { getDict } from "@/i18n/server";
import { requireUser } from "@/lib/server/auth";
import { SetupForm } from "./SetupForm";

export default function SetupPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="mx-auto max-w-lg h-96 rounded-2xl bg-surface-2 animate-pulse" />}>
        <Setup />
      </Suspense>
    </PageTransition>
  );
}

async function Setup() {
  const user = await requireUser();
  const d = await db();
  if (await d.query.businesses.findFirst({ where: eq(businesses.ownerId, user.id) })) redirect("/dashboard");
  const { t } = await getDict();
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="display text-[44px]">{t.dash.setupTitle}</h1>
      <p className="mt-2 text-muted">{t.dash.setupBody}</p>
      <SetupForm t={{ dash: t.dash, businessTypes: t.businessTypes, common: t.common }} />
    </div>
  );
}
