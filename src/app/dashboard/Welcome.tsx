import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import type { businesses } from "@/db/schema";
import type { Dict, Locale } from "@/i18n/dict";
import { PRICE_PER_MONTH } from "@/lib/contact";
import { formatDateLong } from "@/lib/format";
import { dateKeyOf, formatTime } from "@/lib/time";
import { ChecklistHide, ContinueButton, ShareLink } from "./WelcomeActions";

type Business = typeof businesses.$inferSelect;
type Next = { startsAt: Date; customer: string; service: string } | null;

const DAY = 86_400_000;

/** Top of the dashboard: trial line, the booking link, a short checklist, the next booking. */
export function Welcome({ business, link, hasBookings, next, now, t, locale }: { business: Business; link: string; hasBookings: boolean; next: Next; now: Date; t: Dict; locale: Locale }) {
  const tr = t.trial;
  const daysLeft = business.trialEndsAt ? Math.ceil((business.trialEndsAt.getTime() - now.getTime()) / DAY) : null;
  const steps = [
    { done: !!business.servicesSeenAt, label: tr.check1, href: "/dashboard/services" },
    { done: hasBookings, label: tr.check2, href: `/${business.slug}` },
    { done: !!business.linkSharedAt, label: tr.check3 },
  ];
  const tz = business.timezone;

  return (
    <div className="space-y-4">
      {daysLeft !== null && (
        <p className="text-sm text-muted">{daysLeft <= 0 ? tr.ended : daysLeft === 1 ? tr.dayLeft : tr.daysLeft.replace("{n}", String(daysLeft))}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="card p-6">
          <h2 className="display text-[28px]">{tr.ready}</h2>
          <a href={link} target="_blank" rel="noreferrer" className="mt-3 block truncate text-lg font-semibold text-accent">
            {link.replace(/^https?:\/\//, "")}
          </a>
          <div className="mt-5">
            <ShareLink url={link} t={tr} />
          </div>
        </section>

        <div className="space-y-4">
          {!steps.every((s) => s.done) && (
            <ChecklistHide label={tr.hideChecklist}>
              <ol className="card p-5 space-y-3">
                {steps.map((s) => (
                  <li key={s.label} className="flex items-center gap-3">
                    {s.done ? <CheckCircle2 className="size-5 shrink-0 text-ok" /> : <Circle className="size-5 shrink-0 text-muted" />}
                    {s.href && !s.done ? (
                      <Link href={s.href} target={s.href.startsWith("/dashboard") ? undefined : "_blank"} className="font-medium hover:text-accent underline-offset-4 hover:underline">
                        {s.label}
                      </Link>
                    ) : (
                      <span className={s.done ? "text-muted line-through" : "font-medium"}>{s.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </ChecklistHide>
          )}

          {next && (
            <section className="card p-5">
              <p className="text-sm text-muted">{tr.next}</p>
              <p className="mt-1 text-lg font-semibold">
                {dateKeyOf(next.startsAt, tz) === dateKeyOf(now, tz) ? tr.today : formatDateLong(dateKeyOf(next.startsAt, tz), t, locale)} · {formatTime(next.startsAt, tz)}
              </p>
              <p className="text-muted">
                {next.customer} · {next.service}
              </p>
            </section>
          )}

          {/* From one day before the trial ends */}
          {daysLeft !== null && daysLeft <= 1 && (
            <section className="card p-5 space-y-3">
              <h2 className="text-lg font-bold">{tr.enjoyTitle}</h2>
              <p className="text-muted">{tr.enjoyBody}</p>
              {PRICE_PER_MONTH && (
                <p className="font-semibold">
                  {PRICE_PER_MONTH} {tr.perMonth}
                </p>
              )}
              <ContinueButton requested={!!business.continueRequestedAt} message={`${tr.continueMessage} ${business.name}.`} t={tr} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
