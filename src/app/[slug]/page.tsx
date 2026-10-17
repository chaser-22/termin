import { Suspense } from "react";
import { and, asc, eq, inArray } from "drizzle-orm";
import { MapPin, Phone } from "lucide-react";
import { businesses, services, staff, workingHours } from "@/db/schema";
import { getDict } from "@/i18n/server";
import type { Dict } from "@/i18n/dict";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { brandCss } from "@/lib/brand";
import { bookableRange, firstFreeSlot } from "@/lib/server/booking";
import { db } from "@/lib/server/db";
import { openStatus, type OpenStatus } from "@/lib/openStatus";
import { addDays, dateKeyOf, formatMinutes, formatTime, isoWeekday, parseDateKey, todayKey } from "@/lib/time";
import { BookingFlow } from "./BookingFlow";

export default function BusinessPage({ params }: PageProps<"/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BusinessBooking params={params} />
    </Suspense>
  );
}

async function BusinessBooking({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { locale, t } = await getDict();
  const d = await db();
  const business = await d.query.businesses.findFirst({ where: eq(businesses.slug, slug) });
  if (!business) {
    return (
      <main className="flex-1 grid place-items-center px-4 py-20">
        <p className="card p-8 max-w-sm text-center text-muted">{t.book.notFound}</p>
      </main>
    );
  }

  const [serviceRows, staffRows] = await Promise.all([
    d.select().from(services).where(and(eq(services.businessId, business.id), eq(services.active, true))).orderBy(asc(services.sortOrder), asc(services.createdAt)),
    d.select().from(staff).where(and(eq(staff.businessId, business.id), eq(staff.active, true))).orderBy(asc(staff.sortOrder), asc(staff.createdAt)),
  ]);
  const hours = staffRows.length
    ? await d.select().from(workingHours).where(inArray(workingHours.staffId, staffRows.map((s) => s.id)))
    : [];
  const status = openStatus(hours, business.timezone);
  const firstFree = await firstFreeSlot(business, 7);

  const range = bookableRange(business);
  const days = [];
  for (let key = range.first; key <= range.last; key = addDays(key, 1)) {
    const { m, d: day } = parseDateKey(key);
    days.push({ key, weekday: isoWeekday(key), day, month: m });
  }
  const mapUrl = business.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([business.name, business.address, business.city].filter(Boolean).join(", "))}`
    : null;

  return (
    <div className="flex-1">
      <style>{brandCss(business.brandColor)}</style>

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.16] dark:opacity-[0.22]"
          style={{
            background:
              "radial-gradient(120% 90% at 0% 0%, var(--accent) 0%, transparent 55%), radial-gradient(90% 80% at 100% 10%, var(--accent) 0%, transparent 50%)",
          }}
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-bg" />
        <div className="relative mx-auto max-w-xl px-5 pt-5 pb-8">
          <div className="flex items-center justify-between">
            <span className="eyebrow truncate">
              {t.businessTypes[business.type]}
              {business.city ? ` · ${business.city}` : ""}
            </span>
            <LanguageSwitch current={locale} />
          </div>

          <div className="mt-8 flex items-end gap-4 animate-rise">
            <div className="grid place-items-center size-[72px] shrink-0 rounded-[22px] bg-accent text-accent-ink display text-[40px] shadow-lift">
              {business.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="display text-[38px] sm:text-[44px] break-words">{business.name}</h1>
            </div>
          </div>

          {business.description && <p className="mt-4 text-[15px] text-muted leading-relaxed animate-rise [animation-delay:60ms]">{business.description}</p>}

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm animate-rise [animation-delay:90ms]">
            <StatusPill status={status} t={t} />
          </div>

          {(business.phone || mapUrl) && (
            <div className="mt-5 flex gap-2.5 animate-rise [animation-delay:120ms]">
              {business.phone && (
                <a href={`tel:${business.phone.replace(/\s/g, "")}`} className="btn-secondary btn-sm">
                  <Phone className="size-4" /> {t.booking.call}
                </a>
              )}
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm min-w-0">
                  <MapPin className="size-4 shrink-0" /> <span className="truncate">{business.address}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl px-4 pb-10">
        <BookingFlow
          slug={business.slug}
          timeZone={business.timezone}
          today={todayKey(business.timezone)}
          tomorrow={addDays(todayKey(business.timezone), 1)}
          firstFree={
            firstFree
              ? {
                  day: dateKeyOf(firstFree, business.timezone),
                  time: formatTime(firstFree, business.timezone),
                }
              : null
          }
          services={serviceRows.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes, priceCents: s.priceCents }))}
          staff={staffRows.map((s) => ({
            id: s.id,
            name: s.name,
            weekdays: [...new Set(hours.filter((h) => h.staffId === s.id).map((h) => h.weekday))],
          }))}
          days={days}
          t={{ book: t.book, common: t.common, weekdaysShort: t.weekdaysShort, months: t.months }}
        />
        <footer className="mt-10 flex flex-col items-center gap-2 text-xs text-muted">
          <p>
            {t.book.payOnSite} · {t.book.noBookingFee}
          </p>
          <p className="opacity-70">
            {t.appName} — <span className="display text-sm">{t.tagline}</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

function StatusPill({ status, t }: { status: OpenStatus; t: Dict }) {
  if (status.open) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-ok-soft px-3 py-1 font-medium text-ok">
        <span className="size-1.5 rounded-full bg-ok animate-pulse-dot" />
        {t.book.openNow} · {t.book.until} {formatMinutes(status.until)}
      </span>
    );
  }
  let when = "";
  if (status.opensDate) {
    const time = formatMinutes(status.opensAt);
    when =
      status.inDays === 0
        ? `${t.book.opensToday} ${time}`
        : status.inDays === 1
          ? `${t.book.opensTomorrow} ${time}`
          : `${t.book.opensOn} ${t.weekdays[isoWeekday(status.opensDate) - 1].toLowerCase()} ${time}`;
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 font-medium text-muted">
      <span className="size-1.5 rounded-full bg-muted/60" />
      {t.book.closedNow}
      {when && ` · ${when}`}
    </span>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl px-5 pt-16 animate-pulse space-y-6">
      <div className="flex items-end gap-4">
        <div className="size-[72px] rounded-[22px] bg-surface-2" />
        <div className="h-10 w-56 rounded-xl bg-surface-2" />
      </div>
      <div className="h-7 w-44 rounded-full bg-surface-2" />
      <div className="h-80 rounded-3xl bg-surface-2" />
    </div>
  );
}
