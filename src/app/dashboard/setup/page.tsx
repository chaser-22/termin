import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { businesses } from "@/db/schema";
import { db } from "@/lib/server/db";
import { getDict } from "@/i18n/server";
import { requireUser } from "@/lib/server/auth";
import { appOrigin } from "@/lib/server/url";
import { SetupForm } from "./SetupForm";

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg h-96 rounded-2xl bg-surface-2 animate-pulse" />}>
      <Setup />
    </Suspense>
  );
}

async function Setup() {
  const user = await requireUser();
  const d = await db();
  if (await d.query.businesses.findFirst({ where: eq(businesses.ownerId, user.id) })) redirect("/dashboard");
  const { t } = await getDict();
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">{t.dash.setupTitle}</h1>
      <p className="mt-2 text-muted">{t.dash.setupBody}</p>
      <SetupForm host={(await appOrigin()).replace(/^https?:\/\//, "")} t={{ dash: t.dash, businessTypes: t.businessTypes, common: t.common }} />
    </div>
  );
}
