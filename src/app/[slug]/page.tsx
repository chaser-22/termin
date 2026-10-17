import { Suspense } from "react";
import { and, asc, eq, inArray } from "drizzle-orm";
import { businesses, services, staff, workingHours } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { bookableRange } from "@/lib/server/booking";
import { db } from "@/lib/server/db";
import { addDays, isoWeekday, parseDateKey } from "@/lib/time";
import { BookingFlow } from "./BookingFlow";

export default function BusinessPage({ params }: PageProps<"/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <Suspense fallback={<PageSkeleton />}>
        <BusinessBooking params={params} />
      </Suspense>
    </main>
  );
}

async function BusinessBooking({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { locale, t } = await getDict();
  const d = await db();
  const business = await d.query.businesses.findFirst({ where: eq(businesses.slug, slug) });
  if (!business) {
    return (
      <div className="card p-8 text-center">
        <p className="text-muted">{t.book.notFound}</p>
      </div>
    );
  }

  const [serviceRows, staffRows] = await Promise.all([
    d.select().from(services).where(and(eq(services.businessId, business.id), eq(services.active, true))).orderBy(asc(services.sortOrder), asc(services.createdAt)),
    d.select().from(staff).where(and(eq(staff.businessId, business.id), eq(staff.active, true))).orderBy(asc(staff.sortOrder), asc(staff.createdAt)),
  ]);
  const hours = staffRows.length
    ? await d.select().from(workingHours).where(inArray(workingHours.staffId, staffRows.map((s) => s.id)))
    : [];

  const range = bookableRange(business);
  const days = [];
  for (let key = range.first; key <= range.last; key = addDays(key, 1)) {
    const { m, d: day } = parseDateKey(key);
    days.push({ key, weekday: isoWeekday(key), day, month: m });
  }

  return (
    <>
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="grid place-items-center size-14 shrink-0 rounded-2xl bg-accent text-accent-ink text-xl font-semibold">
              {business.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight truncate">{business.name}</h1>
              <p className="text-sm text-muted truncate">
                {t.businessTypes[business.type]}
                {business.city ? ` · ${business.city}` : ""}
              </p>
            </div>
          </div>
          <LanguageSwitch current={locale} />
        </div>
        {(business.address || business.phone || business.description) && (
          <div className="mt-4 space-y-1 text-sm text-muted">
            {business.description && <p className="text-ink">{business.description}</p>}
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              {business.address && (
                <a
                  className="hover:text-ink underline-offset-2 hover:underline"
                  href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(`${business.address}, ${business.city ?? ""}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {business.address}
                </a>
              )}
              {business.phone && (
                <a className="hover:text-ink" href={`tel:${business.phone.replace(/\s/g, "")}`}>
                  {business.phone}
                </a>
              )}
            </p>
          </div>
        )}
      </header>

      <BookingFlow
        slug={business.slug}
        timeZone={business.timezone}
        services={serviceRows.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes, priceCents: s.priceCents }))}
        staff={staffRows.map((s) => ({
          id: s.id,
          name: s.name,
          weekdays: [...new Set(hours.filter((h) => h.staffId === s.id).map((h) => h.weekday))],
        }))}
        days={days}
        t={{ book: t.book, common: t.common, weekdaysShort: t.weekdaysShort, months: t.months }}
      />
      <p className="text-center text-xs text-muted mt-2">{t.book.payOnSite}</p>
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-3.5">
        <div className="size-14 rounded-2xl bg-surface-2" />
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-surface-2" />
          <div className="h-4 w-24 rounded bg-surface-2" />
        </div>
      </div>
      <div className="h-64 rounded-2xl bg-surface-2" />
    </div>
  );
}
