import "server-only";
import { and, asc, eq, gt, inArray, lt, ne } from "drizzle-orm";
import { bookings, businesses, classTimes, customers, services, serviceStaff, staff, workingHours, type Business, type BookingSource, type Service } from "@/db/schema";
import { availableStarts, fits, mergeStaffSlots, placesTaken } from "@/lib/slots";
import { addDays, dateKeyOf, localToInstant, todayKey, type DateKey } from "@/lib/time";
import { randomToken } from "./crypto";
import { db } from "./db";

type Tx = Parameters<Parameters<Awaited<ReturnType<typeof db>>["transaction"]>[0]>[0];
type Conn = Awaited<ReturnType<typeof db>> | Tx;

export function bookableRange(business: Business, now = new Date()) {
  const first = todayKey(business.timezone, now);
  return { first, last: addDays(first, business.maxDaysAhead) };
}

function dayBounds(date: DateKey, timeZone: string) {
  return { start: localToInstant(date, 0, timeZone), end: localToInstant(addDays(date, 1), 0, timeZone) };
}

async function busyFor(conn: Conn, staffIds: string[], from: Date, to: Date) {
  if (staffIds.length === 0) return [];
  return conn
    .select({ staffId: bookings.staffId, serviceId: bookings.serviceId, startsAt: bookings.startsAt, endsAt: bookings.endsAt })
    .from(bookings)
    .where(
      and(
        inArray(bookings.staffId, staffIds),
        ne(bookings.status, "cancelled"),
        lt(bookings.startsAt, to),
        gt(bookings.endsAt, from),
      ),
    );
}

/**
 * Active people/resources of a business in display order, optionally just one.
 * With `serviceId`, only those linked to that service (or everyone, when the
 * service has no links).
 */
async function activeStaffIds(conn: Conn, businessId: string, staffId: string | null, serviceId?: string) {
  const rows = await conn
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.businessId, businessId), eq(staff.active, true), staffId ? eq(staff.id, staffId) : undefined))
    .orderBy(asc(staff.sortOrder), asc(staff.createdAt));
  const ids = rows.map((r) => r.id);
  if (!serviceId) return ids;
  const links = await conn.select({ staffId: serviceStaff.staffId }).from(serviceStaff).where(eq(serviceStaff.serviceId, serviceId));
  if (links.length === 0) return ids;
  const allowed = new Set(links.map((l) => l.staffId));
  return ids.filter((id) => allowed.has(id));
}

/** One day's free starts, merged across staff, with places left for classes. */
type DaySlots = { starts: string[]; left: Record<string, number> };

/**
 * Free starts for `service` from `first` to `last` (inclusive), per day, in
 * three queries. For a class, the people are those on its schedule.
 */
async function computeSlots(conn: Conn, business: Business, service: Service, staffIds: string[], first: DateKey, last: DateKey, now: Date) {
  const schedule = await conn.select().from(classTimes).where(eq(classTimes.serviceId, service.id));
  const isScheduled = schedule.length > 0;
  const ids = isScheduled ? staffIds.filter((id) => schedule.some((c) => c.staffId === id)) : staffIds;
  const [hours, busy] = await Promise.all([
    ids.length ? conn.select().from(workingHours).where(inArray(workingHours.staffId, ids)) : [],
    busyFor(conn, ids, dayBounds(first, business.timezone).start, dayBounds(last, business.timezone).end),
  ]);
  const result: Record<DateKey, DaySlots> = {};
  for (let date = first; date <= last; date = addDays(date, 1)) {
    const left: Record<string, number> = {};
    const perStaff = ids.map((id) => {
      const staffBusy = busy.filter((b) => b.staffId === id);
      const starts = availableStarts({
        date,
        timeZone: business.timezone,
        hours: hours.filter((h) => h.staffId === id),
        busy: staffBusy,
        durationMinutes: service.durationMinutes,
        stepMinutes: business.slotStepMinutes,
        now,
        minNoticeMinutes: business.minNoticeMinutes,
        capacity: service.capacity,
        serviceId: service.id,
        classTimes: isScheduled ? schedule.filter((c) => c.staffId === id) : undefined,
      });
      if (service.capacity > 1) {
        for (const st of starts) {
          const iso = st.toISOString();
          left[iso] = Math.max(left[iso] ?? 0, service.capacity - placesTaken(st, staffBusy, service.id));
        }
      }
      return { staffId: id, starts };
    });
    result[date] = { starts: mergeStaffSlots(perStaff).map((s) => s.start.toISOString()), left };
  }
  return result;
}

async function activeService(conn: Conn, business: Business, serviceId: string) {
  return conn.query.services.findFirst({
    where: and(eq(services.id, serviceId), eq(services.businessId, business.id), eq(services.active, true)),
  });
}

/** Free start times on one day, for one staff member or anyone. */
export async function getSlots(business: Business, serviceId: string, staffId: string | null, date: DateKey) {
  const now = new Date();
  const range = bookableRange(business, now);
  if (date < range.first || date > range.last) return [];
  const d = await db();
  const service = await activeService(d, business, serviceId);
  if (!service) return [];
  const staffIds = await activeStaffIds(d, business.id, staffId, service.id);
  return (await computeSlots(d, business, service, staffIds, date, date, now))[date].starts;
}

/**
 * Free start times for each day from `from` for `days` days (clipped to the
 * booking window). Days with no times are included as []. `left` has places
 * left per start, for classes only.
 */
export async function getSlotsRange(business: Business, serviceId: string, staffId: string | null, from: DateKey, days: number) {
  const now = new Date();
  const range = bookableRange(business, now);
  const first = from < range.first ? range.first : from;
  const lastWanted = addDays(first, Math.max(1, Math.min(days, 31)) - 1);
  const last = lastWanted > range.last ? range.last : lastWanted;
  const result: Record<DateKey, string[]> = {};
  const left: Record<string, number> = {};
  if (first > last) return { days: result, left };

  const d = await db();
  const service = await activeService(d, business, serviceId);
  if (!service) return { days: result, left };
  const staffIds = await activeStaffIds(d, business.id, staffId, service.id);
  const computed = await computeSlots(d, business, service, staffIds, first, last, now);
  for (const [date, day] of Object.entries(computed)) {
    result[date] = day.starts;
    Object.assign(left, day.left);
  }
  return { days: result, left };
}

/** The earliest free time in the next `days` days for the shortest active service, and that service. */
export async function firstFreeSlot(business: Business, days = 7) {
  const d = await db();
  const shortest = await d.query.services.findFirst({
    where: and(eq(services.businessId, business.id), eq(services.active, true)),
    orderBy: (s, { asc }) => [asc(s.durationMinutes)],
  });
  if (!shortest) return null;
  const { days: range } = await getSlotsRange(business, shortest.id, null, todayKey(business.timezone), days);
  for (const date of Object.keys(range).sort()) {
    if (range[date].length) return { serviceId: shortest.id, start: new Date(range[date][0]) };
  }
  return null;
}

export type CreateBookingInput = {
  business: Business;
  serviceId: string;
  staffId: string | null;
  startsAt: Date;
  name: string;
  phone: string;
  email?: string | null;
  note?: string | null;
  source: BookingSource;
};

export type CreateBookingResult =
  | { ok: true; publicToken: string; bookingId: string }
  | { ok: false; error: "slot_taken" | "invalid" };

/**
 * Creates a booking if the time is still free. Online bookings must match an
 * offered slot; walk-ins and phone bookings from the dashboard only need the
 * staff member to be free. Staff rows are locked so two people can't take the
 * same time at once.
 */
export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const d = await db();
  const service = await d.query.services.findFirst({
    where: and(eq(services.id, input.serviceId), eq(services.businessId, input.business.id)),
  });
  if (!service || (input.source === "online" && !service.active)) return { ok: false, error: "invalid" };

  const startsAt = input.startsAt;
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
  const date = dateKeyOf(startsAt, input.business.timezone);
  if (input.source === "online") {
    const range = bookableRange(input.business);
    if (date < range.first || date > range.last) return { ok: false, error: "invalid" };
  }

  return d.transaction(async (tx) => {
    // Online bookings only go to people/resources that do this service; the
    // business itself may book anyone from the dashboard.
    const candidates = await activeStaffIds(tx, input.business.id, input.staffId, input.source === "online" ? service.id : undefined);
    let chosen: string | null = null;
    for (const staffId of candidates) {
      await tx.select({ id: staff.id }).from(staff).where(eq(staff.id, staffId)).for("update");
      if (input.source === "online") {
        const day = (await computeSlots(tx, input.business, service, [staffId], date, date, new Date()))[date];
        if (day.starts.includes(startsAt.toISOString())) {
          chosen = staffId;
          break;
        }
      } else {
        const busy = await busyFor(tx, [staffId], startsAt, endsAt);
        if (fits(startsAt, endsAt, busy, service.capacity, service.id)) {
          chosen = staffId;
          break;
        }
      }
    }
    if (!chosen) return { ok: false as const, error: "slot_taken" as const };

    const [customer] = await tx
      .insert(customers)
      .values({ businessId: input.business.id, name: input.name, phone: input.phone, email: input.email || null })
      .onConflictDoUpdate({
        target: [customers.businessId, customers.phone],
        set: input.email ? { name: input.name, email: input.email } : { name: input.name },
      })
      .returning();

    const publicToken = randomToken(18);
    const [booking] = await tx
      .insert(bookings)
      .values({
        businessId: input.business.id,
        staffId: chosen,
        serviceId: service.id,
        customerId: customer.id,
        startsAt,
        endsAt,
        source: input.source,
        note: input.note || null,
        publicToken,
      })
      .returning({ id: bookings.id });
    return { ok: true as const, publicToken, bookingId: booking.id };
  });
}

export async function getBookingByToken(token: string) {
  const d = await db();
  const [row] = await d
    .select({ booking: bookings, business: businesses, service: services, staff })
    .from(bookings)
    .innerJoin(businesses, eq(businesses.id, bookings.businessId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(staff, eq(staff.id, bookings.staffId))
    .where(eq(bookings.publicToken, token));
  return row ?? null;
}

/** Customer-side cancel from their private link. Only future bookings. */
export async function cancelByToken(token: string): Promise<boolean> {
  const d = await db();
  const now = new Date();
  const rows = await d
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: now })
    .where(and(eq(bookings.publicToken, token), eq(bookings.status, "confirmed"), gt(bookings.startsAt, now)))
    .returning({ id: bookings.id });
  return rows.length > 0;
}
