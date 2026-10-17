import { Suspense } from "react";
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
  await requireUser();
  const { t } = await getDict();
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">{t.dash.setupTitle}</h1>
      <p className="mt-2 text-muted">{t.dash.setupBody}</p>
      <SetupForm host={(await appOrigin()).replace(/^https?:\/\//, "")} t={{ dash: t.dash, businessTypes: t.businessTypes, common: t.common }} />
    </div>
  );
}
