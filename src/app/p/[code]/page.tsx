import { Suspense } from "react";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowDown } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { businesses, invites } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { db } from "@/lib/server/db";
import { demoSlugFor } from "@/lib/verticals";
import { BookingPage } from "@/app/[slug]/page";
import { InvitePreview } from "./InvitePreview";

export const metadata = { robots: { index: false } };

// The personal link you send an owner: their name on a working booking page.
// The page runs on the demo business for their type, so nothing private shows.
export default function InvitePage({ params }: PageProps<"/p/[code]">) {
  return (
    <PageTransition>
      <Suspense fallback={<div className="flex-1" />}>
        <Invite params={params} />
      </Suspense>
    </PageTransition>
  );
}

async function Invite({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { t } = await getDict();
  const d = await db();
  const invite = await d.query.invites.findFirst({ where: eq(invites.code, code) });
  if (!invite || invite.usedAt) {
    return (
      <main className="flex-1 grid place-items-center px-4 py-20">
        <div className="card p-8 max-w-sm text-center space-y-4">
          <p className="text-muted">{invite ? t.trial.inviteUsed : t.book.notFound}</p>
          <Link href="/login" className="btn-primary w-full">{t.trial.signIn}</Link>
        </div>
      </main>
    );
  }
  const demo = await d.query.businesses.findFirst({ where: eq(businesses.slug, demoSlugFor(invite.type)) });

  return (
    <div className="flex-1">
      <section className="mx-auto max-w-xl px-5 pt-12 pb-8 text-center">
        <p className="eyebrow animate-rise">{invite.businessName}</p>
        <h1 className="display text-[36px] sm:text-[48px] leading-[1.05] mt-3 animate-rise [animation-delay:60ms]">{t.trial.headline}</h1>
        <p className="mt-4 text-lg text-muted animate-rise [animation-delay:120ms]">{t.trial.sub}</p>
        <a href="#preview" className="mt-7 btn-primary h-13 px-8 text-base animate-rise [animation-delay:180ms]">
          {t.trial.seePage} <ArrowDown className="size-4" />
        </a>
        <p className="mt-4 text-sm text-muted animate-rise [animation-delay:220ms]">{t.trial.reassurance}</p>
      </section>
      <div id="preview" className="scroll-mt-4">
        <InvitePreview startHref={`/start?invite=${invite.code}`} t={t.trial}>
          {demo ? <BookingPage business={demo} displayName={invite.businessName} displayType={invite.type} /> : null}
        </InvitePreview>
      </div>
    </div>
  );
}
