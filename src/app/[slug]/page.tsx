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
  const tz = business.timezone;

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
    <div className="flex-1 overflow-x-clip">
      <style>{brandCss(business.brandColor)}</style>

      <div className="mx-auto max-w-xl px-4 pt-4 flex justify-end">
        <LanguageSwitch current={locale} />
      </div>

      {/* Hero: a clearing in the fog */}
      <header className="relative mx-auto max-w-xl px-5 pt-4 pb-8 text-center">
        <div
          aria-hidden
          className="absolute left-1/2 top-6 -z-10 h-48 w-[34rem] max-w-full -translate-x-1/2 rounded-full bg-white/70 blur-3xl dark:bg-white/[0.04]"
        />
        <div className="mx-auto grid place-items-center size-[76px] rounded-full bg-accent text-accent-ink display text-[34px] shadow-[0_0_0_7px_var(--glass),0_18px_36px_-16px_var(--accent)] animate-pop">
          {business.name.slice(0, 1).toUpperCase()}
        </div>
        <p className="eyebrow mt-6 animate-rise [animation-delay:60ms]">
          {t.businessTypes[business.type]}
          {business.city ? ` · ${business.city}` : ""}
        </p>
        <h1 className="display mt-2.5 text-balance animate-rise [animation-delay:100ms]" style={{ fontSize: nameSize(business.name) }}>
          {business.name}
        </h1>
        {business.description && <p className="mx-auto mt-3 max-w-md text-[15px] text-muted leading-relaxed animate-rise [animation-delay:140ms]">{business.description}</p>}
        <div className="mt-4 flex justify-center animate-rise [animation-delay:160ms]">
          <StatusPill status={status} t={t} />
        </div>
        {(business.phone || mapUrl) && (
          <div className="mt-5 flex justify-center gap-2.5 animate-rise [animation-delay:200ms]">
            {business.phone && (
              <a href={`tel:${business.phone.replace(/\s/g, "")}`} className="btn-secondary btn-sm">
                <Phone className="size-4" /> {t.booking.call}
              </a>
            )}
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm min-w-0 max-w-[60%]">
                <MapPin className="size-4 shrink-0" /> <span className="truncate">{business.address}</span>
              </a>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-xl px-4 pb-36">
        <BookingFlow
          slug={business.slug}
          timeZone={tz}
          today={todayKey(tz)}
          tomorrow={addDays(todayKey(tz), 1)}
          firstFree={
            firstFree
              ? { serviceId: firstFree.serviceId, iso: firstFree.start.toISOString(), day: dateKeyOf(firstFree.start, tz), time: formatTime(firstFree.start, tz) }
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
        <footer className="mt-12 flex flex-col items-center gap-2 text-xs text-muted">
          <p>
            {t.book.payOnSite} · {t.book.noBookingFee}
          </p>
          <p className="opacity-70">
            <span className="display text-[13px]">{t.appName}</span> · {t.tagline}
          </p>
        </footer>
      </main>
    </div>
  );
}

/** Fit the longest word of the name on one line: Syne is wide, so long words get smaller type. */
function nameSize(name: string): string {
  const longest = Math.max(...name.split(/\s+/).map((w) => w.length), 1);
  return `min(48px, calc((min(100vw, 576px) - 48px) / ${(longest * 0.9).toFixed(2)}))`;
}

function StatusPill({ status, t }: { status: OpenStatus; t: Dict }) {
  if (status.open) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-glass border border-[var(--glass-border)] backdrop-blur-md px-3.5 py-1.5 text-sm font-semibold text-ok">
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
    <span className="inline-flex items-center gap-2 rounded-full bg-glass border border-[var(--glass-border)] backdrop-blur-md px-3.5 py-1.5 text-sm font-medium text-muted">
      <span className="size-1.5 rounded-full bg-muted/60" />
      {t.book.closedNow}
      {when && ` · ${when}`}
    </span>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl px-5 pt-16 animate-pulse flex flex-col items-center gap-5">
      <div className="size-[76px] rounded-full bg-surface-2" />
      <div className="h-10 w-60 rounded-xl bg-surface-2" />
      <div className="h-8 w-44 rounded-full bg-surface-2" />
      <div className="mt-4 grid w-full grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-3xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
