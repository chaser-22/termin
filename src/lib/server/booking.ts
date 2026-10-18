import "server-only";
import { and, asc, eq, gt, inArray, lt, ne } from "drizzle-orm";
import { bookings, businesses, customers, services, staff, workingHours, type Business, type BookingSource } from "@/db/schema";
import { availableStarts, mergeStaffSlots, overlaps } from "@/lib/slots";
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
    .select({ staffId: bookings.staffId, startsAt: bookings.startsAt, endsAt: bookings.endsAt })
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

async function startsForStaff(conn: Conn, business: Business, staffIds: string[], date: DateKey, durationMinutes: number, now: Date) {
  const { start, end } = dayBounds(date, business.timezone);
  const [hours, busy] = await Promise.all([
    staffIds.length ? conn.select().from(workingHours).where(inArray(workingHours.staffId, staffIds)) : [],
    busyFor(conn, staffIds, start, end),
  ]);
  return staffIds.map((staffId) => ({
    staffId,
    starts: availableStarts({
      date,
      timeZone: business.timezone,
      hours: hours.filter((h) => h.staffId === staffId),
      busy: busy.filter((b) => b.staffId === staffId),
      durationMinutes,
      stepMinutes: business.slotStepMinutes,
      now,
      minNoticeMinutes: business.minNoticeMinutes,
    }),
  }));
}

async function activeStaffIds(conn: Conn, businessId: string, staffId: string | null) {
  const rows = await conn
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.businessId, businessId), eq(staff.active, true), staffId ? eq(staff.id, staffId) : undefined))
    .orderBy(asc(staff.sortOrder), asc(staff.createdAt));
  return rows.map((r) => r.id);
}

/** Free start times on one day, for one staff member or anyone. */
export async function getSlots(business: Business, serviceId: string, staffId: string | null, date: DateKey) {
  const now = new Date();
  const range = bookableRange(business, now);
  if (date < range.first || date > range.last) return [];
  const d = await db();
  const service = await d.query.services.findFirst({
    where: and(eq(services.id, serviceId), eq(services.businessId, business.id), eq(services.active, true)),
  });
  if (!service) return [];
  const staffIds = await activeStaffIds(d, business.id, staffId);
  const perStaff = await startsForStaff(d, business, staffIds, date, service.durationMinutes, now);
  return mergeStaffSlots(perStaff).map((s) => s.start.toISOString());
}

/**
 * Free start times for each day from `from` for `days` days (clipped to the
 * booking window), in two queries. Days with no times are included as [].
 */
export async function getSlotsRange(business: Business, serviceId: string, staffId: string | null, from: DateKey, days: number) {
  const now = new Date();
  const range = bookableRange(business, now);
  const first = from < range.first ? range.first : from;
  const lastWanted = addDays(first, Math.max(1, Math.min(days, 31)) - 1);
  const last = lastWanted > range.last ? range.last : lastWanted;
  const result: Record<DateKey, string[]> = {};
  if (first > last) return result;

  const d = await db();
  const service = await d.query.services.findFirst({
    where: and(eq(services.id, serviceId), eq(services.businessId, business.id), eq(services.active, true)),
  });
  if (!service) return result;
  const staffIds = await activeStaffIds(d, business.id, staffId);
  const [hours, busy] = await Promise.all([
    staffIds.length ? d.select().from(workingHours).where(inArray(workingHours.staffId, staffIds)) : [],
    busyFor(d, staffIds, dayBounds(first, business.timezone).start, dayBounds(last, business.timezone).end),
  ]);
  for (let date = first; date <= last; date = addDays(date, 1)) {
    const perStaff = staffIds.map((id) => ({
      staffId: id,
      starts: availableStarts({
        date,
        timeZone: business.timezone,
        hours: hours.filter((h) => h.staffId === id),
        busy: busy.filter((b) => b.staffId === id),
        durationMinutes: service.durationMinutes,
        stepMinutes: business.slotStepMinutes,
        now,
        minNoticeMinutes: business.minNoticeMinutes,
      }),
    }));
    result[date] = mergeStaffSlots(perStaff).map((s) => s.start.toISOString());
  }
  return result;
}

/** The earliest free time in the next `days` days for the shortest active service, and that service. */
export async function firstFreeSlot(business: Business, days = 7) {
  const d = await db();
  const shortest = await d.query.services.findFirst({
    where: and(eq(services.businessId, business.id), eq(services.active, true)),
    orderBy: (s, { asc }) => [asc(s.durationMinutes)],
  });
  if (!shortest) return null;
  const range = await getSlotsRange(business, shortest.id, null, todayKey(business.timezone), days);
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
    const candidates = await activeStaffIds(tx, input.business.id, input.staffId);
    let chosen: string | null = null;
    for (const staffId of candidates) {
      await tx.select({ id: staff.id }).from(staff).where(eq(staff.id, staffId)).for("update");
      if (input.source === "online") {
        const [{ starts }] = await startsForStaff(tx, input.business, [staffId], date, service.durationMinutes, new Date());
        if (starts.some((s) => s.getTime() === startsAt.getTime())) {
          chosen = staffId;
          break;
        }
      } else {
        const busy = await busyFor(tx, [staffId], startsAt, endsAt);
        if (!busy.some((b) => overlaps(startsAt, endsAt, b.startsAt, b.endsAt))) {
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
