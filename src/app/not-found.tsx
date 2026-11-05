import { Suspense } from "react";
import type { Metadata } from "next";
import { DeadEnd } from "@/components/DeadEnd";
import { getDict } from "@/i18n/server";

export const metadata: Metadata = { robots: { index: false } };

export default function NotFound() {
  return (
    <main className="flex-1 grid place-items-center px-4 py-20">
      <Suspense fallback={null}>
        <Message />
      </Suspense>
    </main>
  );
}

async function Message() {
  const { t } = await getDict();
  return <DeadEnd message={t.common.pageNotFound} home={t.common.goHome} />;
}
