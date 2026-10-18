import { Suspense } from "react";
import Link from "next/link";
import { and, asc, eq, gt, inArray, lt } from "drizzle-orm";
import { bookings, customers, services, staff, workingHours, type BookingStatus } from "@/db/schema";
import { getDict } from "@/i18n/server";
import type { Dict } from "@/i18n/dict";
import { requireBusiness } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { formatDateLong, formatPrice } from "@/lib/format";
import { addDays, formatMinutes, formatTime, isDateKey, isoWeekday, localToInstant, minutesOfDay, todayKey } from "@/lib/time";
import { appOrigin } from "@/lib/server/url";
import { BookingActions } from "./BookingActions";
import { NewBookingForm } from "./NewBookingForm";
import { CopyLink } from "./CopyLink";

const PX_PER_MIN = 1.2;

export default function CalendarPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<div className="h-[70vh] rounded-2xl bg-surface-2 animate-pulse" />}>
      <Calendar searchParams={searchParams} />
    </Suspense>
  );
}

const STATUS_STYLE: Record<BookingStatus, string> = {
  confirmed: "bg-accent-soft border-accent/40 text-ink",
  completed: "bg-ok-soft border-ok/30 text-ink",
  no_show: "bg-danger-soft border-danger/30 text-muted line-through",
  cancelled: "bg-surface-2 border-line text-muted line-through opacity-70",
};

async function Calendar({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { business } = await requireBusiness();
  const { locale, t } = await getDict();
  const tz = business.timezone;
  const today = todayKey(tz);
  const date = typeof sp.date === "string" && isDateKey(sp.date) ? sp.date : today;
  const selectedId = typeof sp.b === "string" ? sp.b : null;
  const weekday = isoWeekday(date);

  const d = await db();
  const dayStart = localToInstant(date, 0, tz);
  const dayEnd = localToInstant(addDays(date, 1), 0, tz);
  const [allStaff, serviceRows, dayBookings] = await Promise.all([
    d.select().from(staff).where(eq(staff.businessId, business.id)).orderBy(asc(staff.sortOrder), asc(staff.createdAt)),
    d.select().from(services).where(eq(services.businessId, business.id)).orderBy(asc(services.sortOrder)),
    d
      .select({ booking: bookings, customer: customers })
      .from(bookings)
      .innerJoin(customers, eq(customers.id, bookings.customerId))
      .where(and(eq(bookings.businessId, business.id), lt(bookings.startsAt, dayEnd), gt(bookings.endsAt, dayStart)))
      .orderBy(asc(bookings.startsAt)),
  ]);
  // Hidden staff still appear on days they have bookings, so nothing disappears
  const staffRows = allStaff.filter((s) => s.active || dayBookings.some(({ booking }) => booking.staffId === s.id));
  const cancelled = dayBookings.filter(({ booking }) => booking.status === "cancelled");
  const hours = staffRows.length
    ? await d.select().from(workingHours).where(and(inArray(workingHours.staffId, staffRows.map((s) => s.id)), eq(workingHours.weekday, weekday)))
    : [];

  const serviceById = new Map(serviceRows.map((s) => [s.id, s]));
  // Visible range: working hours and any bookings, rounded to whole hours
  const mins = [
    ...hours.flatMap((h) => [h.startMinute, h.endMinute]),
    ...dayBookings.flatMap(({ booking }) => [minutesOfDay(booking.startsAt, tz), minutesOfDay(booking.endsAt, tz) || 1440]),
  ];
  const startMin = mins.length ? Math.floor(Math.min(...mins) / 60) * 60 : 8 * 60;
  const endMin = mins.length ? Math.ceil(Math.max(...mins) / 60) * 60 : 20 * 60;
  const height = (endMin - startMin) * PX_PER_MIN;

  const active = dayBookings.filter(({ booking }) => booking.status === "confirmed" || booking.status === "completed");
  const expected = active.reduce((sum, { booking }) => sum + (serviceById.get(booking.serviceId)?.priceCents ?? 0), 0);
  const selected = dayBookings.find(({ booking }) => booking.id === selectedId) ?? null;
  const nowMin = date === today ? minutesOfDay(new Date(), tz) : null;
  const link = `${await appOrigin()}/${business.slug}`;
  const hrefFor = (params: { date?: string; b?: string }) => {
    const q = new URLSearchParams();
    const dd = params.date ?? date;
    if (dd !== today) q.set("date", dd);
    if (params.b) q.set("b", params.b);
    const s = q.toString();
    return s ? `/dashboard?${s}` : "/dashboard";
  };

  return (
    <div className="space-y-5">
      {/* Day header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Link href={hrefFor({ date: addDays(date, -1) })} className="btn-secondary btn-sm w-9 px-0" aria-label="Previous day">‹</Link>
          <Link href={hrefFor({ date: today })} className="btn-secondary btn-sm">{t.common.today}</Link>
          <Link href={hrefFor({ date: addDays(date, 1) })} className="btn-secondary btn-sm w-9 px-0" aria-label="Next day">›</Link>
        </div>
        <h1 className="display text-[30px]">{formatDateLong(date, t, locale)}</h1>
        <div className="ml-auto flex items-center gap-4 text-sm text-muted">
          <span>
            <b className="text-ink tabular-nums">{active.length}</b> {t.dash.bookingsToday}
          </span>
          <span>
            {t.dash.expectedCash} <b className="text-ink tabular-nums">{formatPrice(expected, "0 €")}</b>
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px] items-start">
        <div className="space-y-3 min-w-0">
        {/* Time grid */}
        <div className="card overflow-x-auto">
          {staffRows.length === 0 ? (
            <p className="p-8 text-center text-muted">{t.dash.noBookings}</p>
          ) : (
            <div className="min-w-fit">
              <div className="flex border-b border-line sticky top-0 bg-surface z-[1]">
                <div className="w-14 shrink-0" />
                {staffRows.map((s) => (
                  <div key={s.id} className="flex-1 min-w-36 px-3 py-2.5 text-sm font-semibold border-l border-line">{s.name}</div>
                ))}
              </div>
              <div className="flex relative my-3" style={{ height }}>
                {/* Hour labels */}
                <div className="w-14 shrink-0 relative">
                  {Array.from({ length: (endMin - startMin) / 60 + 1 }).map((_, i) => (
                    <span key={i} className="absolute right-2 -translate-y-1/2 text-[11px] text-muted tabular-nums" style={{ top: i * 60 * PX_PER_MIN }}>
                      {formatMinutes(startMin + i * 60)}
                    </span>
                  ))}
                </div>
                {staffRows.map((s) => {
                  const staffHours = hours.filter((h) => h.staffId === s.id);
                  return (
                    <div key={s.id} className="flex-1 min-w-36 relative border-l border-line bg-surface-2/60">
                      {/* Working hours shown as white */}
                      {staffHours.map((h) => (
                        <div key={h.id} className="absolute inset-x-0 bg-surface" style={{ top: (h.startMinute - startMin) * PX_PER_MIN, height: (h.endMinute - h.startMinute) * PX_PER_MIN }} />
                      ))}
                      {/* Hour lines */}
                      {Array.from({ length: (endMin - startMin) / 60 }).map((_, i) => (
                        <div key={i} className="absolute inset-x-0 border-t border-line/70" style={{ top: i * 60 * PX_PER_MIN }} />
                      ))}
                      {groupForGrid(dayBookings.filter(({ booking }) => booking.staffId === s.id && booking.status !== "cancelled"))
                        .map(({ booking, customer, count }) => {
                          const top = (minutesOfDay(booking.startsAt, tz) - startMin) * PX_PER_MIN;
                          const h = Math.max(22, (booking.endsAt.getTime() - booking.startsAt.getTime()) / 60_000 * PX_PER_MIN - 2);
                          const service = serviceById.get(booking.serviceId);
                          const isClass = (service?.capacity ?? 1) > 1;
                          const inSelectedClass = isClass && selected && selected.booking.serviceId === booking.serviceId && selected.booking.startsAt.getTime() === booking.startsAt.getTime() && selected.booking.staffId === booking.staffId;
                          return (
                            <Link
                              key={booking.id}
                              href={hrefFor({ b: booking.id })}
                              scroll={false}
                              className={`absolute inset-x-1 rounded-lg border px-2 py-1 text-xs leading-tight overflow-hidden hover:shadow-md transition-shadow ${STATUS_STYLE[booking.status]} ${
                                booking.id === selectedId || inSelectedClass ? "ring-2 ring-accent" : ""
                              }`}
                              style={{ top: top + 1, height: h }}
                            >
                              <span className="font-semibold tabular-nums">{formatTime(booking.startsAt, tz)}</span>{" "}
                              {isClass ? (
                                <>
                                  {service?.name} <span className="font-semibold tabular-nums">· {count}/{service?.capacity}</span>
                                </>
                              ) : (
                                customer.name
                              )}
                              {h > 30 && !isClass && <span className="block text-muted truncate">{service?.name}</span>}
                            </Link>
                          );
                        })}
                    </div>
                  );
                })}
                {nowMin !== null && nowMin >= startMin && nowMin <= endMin && (
                  <div className="absolute left-14 right-0 border-t-2 border-danger pointer-events-none" style={{ top: (nowMin - startMin) * PX_PER_MIN }}>
                    <span className="absolute -left-1.5 -top-[5px] size-2 rounded-full bg-danger" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {cancelled.length > 0 && (
          <div className="card px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted mb-1.5">{t.dash.cancelledList} ({cancelled.length})</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {cancelled.map(({ booking, customer }) => (
                <li key={booking.id}>
                  <Link href={hrefFor({ b: booking.id })} scroll={false} className={`text-muted line-through hover:text-ink ${booking.id === selectedId ? "text-ink font-medium" : ""}`}>
                    <span className="tabular-nums">{formatTime(booking.startsAt, tz)}</span> {customer.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        </div>

        {/* Side panel */}
        <aside className="space-y-5 order-first lg:order-none lg:sticky lg:top-20">
          {selected && (serviceById.get(selected.booking.serviceId)?.capacity ?? 1) > 1 && (
            <div className="card p-4">
              <p className="display text-[20px]">
                {serviceById.get(selected.booking.serviceId)?.name}{" "}
                <span className="text-muted text-base tabular-nums">{formatTime(selected.booking.startsAt, tz)}</span>
              </p>
              <p className="eyebrow mt-3 mb-1.5">{t.dash.attendees}</p>
              <ul className="space-y-0.5 text-sm">
                {dayBookings
                  .filter(({ booking }) => booking.serviceId === selected.booking.serviceId && booking.staffId === selected.booking.staffId && booking.startsAt.getTime() === selected.booking.startsAt.getTime())
                  .map(({ booking, customer }) => (
                    <li key={booking.id}>
                      <Link
                        href={hrefFor({ b: booking.id })}
                        scroll={false}
                        className={`flex justify-between rounded-lg px-2 py-1 hover:bg-surface ${booking.id === selectedId ? "bg-surface font-semibold" : ""} ${booking.status === "cancelled" ? "line-through text-muted" : ""}`}
                      >
                        {customer.name}
                        <span className="text-muted tabular-nums">{customer.phone}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}
          {selected && (
            <SelectedBooking
              data={selected}
              serviceName={serviceById.get(selected.booking.serviceId)?.name ?? ""}
              staffName={staffRows.find((s) => s.id === selected.booking.staffId)?.name ?? ""}
              businessName={business.name}
              tz={tz}
              t={t}
              closeHref={hrefFor({})}
            />
          )}
          <NewBookingForm
            date={date}
            services={serviceRows.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes }))}
            staff={staffRows.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name }))}
            defaultTime={nowMin !== null ? formatMinutes(Math.ceil(nowMin / 15) * 15 % 1440) : "09:00"}
            t={{ dash: t.dash, book: t.book, common: t.common }}
          />
          <div className="card p-4">
            <p className="text-sm font-medium mb-2">{t.dash.bookingLink}</p>
            <CopyLink url={link} copyLabel={t.dash.copy} copiedLabel={t.dash.copied} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function SelectedBooking({
  data,
  serviceName,
  staffName,
  businessName,
  tz,
  t,
  closeHref,
}: {
  data: { booking: typeof bookings.$inferSelect; customer: typeof customers.$inferSelect };
  serviceName: string;
  staffName: string;
  businessName: string;
  tz: string;
  t: Dict;
  closeHref: string;
}) {
  const { booking, customer } = data;
  const statusLabel: Record<BookingStatus, string> = {
    confirmed: t.dash.statusConfirmed,
    cancelled: t.dash.statusCancelled,
    no_show: t.dash.statusNoShow,
    completed: t.dash.statusCompleted,
  };
  const sourceLabel = { online: t.dash.online, walk_in: t.dash.walkIn, phone: t.dash.phoneBooking }[booking.source];
  const digits = customer.phone.replace(/\D/g, "");
  const time = formatTime(booking.startsAt, tz);
  const reminder = encodeURIComponent(`${businessName}: ${serviceName}, ${time}.`);
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="display text-[22px]">{customer.name}</p>
          <p className="text-sm text-muted tabular-nums">
            {time}–{formatTime(booking.endsAt, tz)} · {serviceName} · {staffName}
          </p>
        </div>
        <Link href={closeHref} scroll={false} className="text-muted hover:text-ink text-lg leading-none" aria-label={t.common.close}>×</Link>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="chip bg-surface-2 text-ink">{statusLabel[booking.status]}</span>
        <span className="chip bg-surface-2 text-muted">{sourceLabel}</span>
      </div>
      {booking.note && <p className="text-sm rounded-lg bg-warn-soft text-warn px-3 py-2">{booking.note}</p>}
      <div className="grid grid-cols-3 gap-2">
        <a href={`tel:${customer.phone}`} className="btn-secondary btn-sm">Tel</a>
        <a href={`viber://chat?number=%2B${digits}`} className="btn-secondary btn-sm">Viber</a>
        <a href={`https://wa.me/${digits}?text=${reminder}`} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">WhatsApp</a>
      </div>
      <p className="text-xs text-muted tabular-nums">{customer.phone}</p>
      <BookingActions
        key={booking.id}
        id={booking.id}
        status={booking.status}
        labels={{ completed: t.dash.markCompleted, noShow: t.dash.markNoShow, cancel: t.common.cancel, restore: t.dash.restore, restoreConflict: t.dash.restoreConflict, error: t.common.error }}
      />
    </div>
  );
}

/** Several bookings of the same class (same service, person and start) become one block with a count. */
function groupForGrid<T extends { booking: { serviceId: string; staffId: string; startsAt: Date } }>(rows: T[]): (T & { count: number })[] {
  const groups = new Map<string, T & { count: number }>();
  for (const row of rows) {
    const key = `${row.booking.serviceId}|${row.booking.staffId}|${row.booking.startsAt.getTime()}`;
    const g = groups.get(key);
    if (g) g.count++;
    else groups.set(key, { ...row, count: 1 });
  }
  return [...groups.values()];
}
