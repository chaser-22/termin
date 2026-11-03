import "server-only";
import { and, eq, gt, inArray, isNotNull, isNull, lte, ne, sql } from "drizzle-orm";
import { bookings, businesses, customers, services, staff, users } from "@/db/schema";
import { DICTS, type Dict, type Locale } from "@/i18n/dict";
import { formatDateLong } from "@/lib/format";
import { addDays, dateKeyOf, formatTime, todayKey } from "@/lib/time";
import { db } from "./db";
import { emailEnabled, sendEmail } from "./email";
import { sendSms, smsEnabled } from "./sms";

/** Clients get their reminder within this many hours of the appointment. */
export const REMINDER_HOURS = 24;

/** "sjutra 11:00", or "Četvrtak, 22. okt 11:00" further out. */
function whenShort(start: Date, timeZone: string, t: Dict, locale: Locale, now: Date) {
  const key = dateKeyOf(start, timeZone);
  const today = todayKey(timeZone, now);
  const day =
    key === today ? t.common.today.toLowerCase()
    : key === addDays(today, 1) ? t.common.tomorrow.toLowerCase()
    : formatDateLong(key, t, locale);
  return `${day} ${formatTime(start, timeZone)}`;
}

function whenLong(start: Date, timeZone: string, t: Dict, locale: Locale) {
  return `${formatDateLong(dateKeyOf(start, timeZone), t, locale)} ${formatTime(start, timeZone)}`;
}

/** Bookings with everything an email about them needs. */
async function bookingDetails(ids: string[]) {
  if (ids.length === 0) return [];
  const d = await db();
  return d
    .select({ booking: bookings, business: businesses, service: services, staff, customer: customers, ownerEmail: users.email })
    .from(bookings)
    .innerJoin(businesses, eq(businesses.id, bookings.businessId))
    .innerJoin(users, eq(users.id, businesses.ownerId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(staff, eq(staff.id, bookings.staffId))
    .innerJoin(customers, eq(customers.id, bookings.customerId))
    .where(inArray(bookings.id, ids));
}

/** Emails the owner about a new online booking, with a link to it in the calendar. */
export async function notifyOwner(bookingId: string, origin: string) {
  const [row] = await bookingDetails([bookingId]);
  if (!row) return;
  const { booking, business, service, customer } = row;
  // Owners don't store a language yet; they're local, so Montenegrin
  const locale: Locale = "me";
  const t = DICTS[locale];
  const tz = business.timezone;
  const lines = [
    `${t.notify.client}: ${customer.name}`,
    `${t.notify.phone}: ${customer.phone}`,
    `${t.booking.service}: ${service.name}`,
    `${t.booking.staff}: ${row.staff.name}`,
    `${t.booking.when}: ${whenLong(booking.startsAt, tz, t, locale)}`,
    booking.note ? `${t.notify.note}: ${booking.note}` : "",
  ].filter(Boolean);
  await sendEmail({
    to: row.ownerEmail,
    subject: `${t.notify.newBooking}: ${customer.name} · ${service.name} · ${whenShort(booking.startsAt, tz, t, locale, new Date())}`,
    text: `${t.notify.newBooking}\n\n${lines.join("\n")}\n\n${t.notify.openInCalendar}\n${origin}/dashboard?date=${dateKeyOf(booking.startsAt, tz)}&b=${booking.id}\n`,
  });
}

/**
 * Marks the bookings due a reminder and returns their ids: confirmed, starting
 * within REMINDER_HOURS, and booked at least that far ahead (a booking made for
 * later today already has its confirmation). Clients need an email, or, when
 * SMS is on, just their phone (every client has one). The mark is set in the
 * same statement, so a booking is only ever claimed once, even when two runs
 * overlap.
 */
export async function claimDueReminders(now = new Date(), withSms = smsEnabled()): Promise<string[]> {
  const d = await db();
  const until = new Date(now.getTime() + REMINDER_HOURS * 3_600_000);
  const due = d
    .select({ id: bookings.id })
    .from(bookings)
    .innerJoin(customers, eq(customers.id, bookings.customerId))
    .where(
      and(
        eq(bookings.status, "confirmed"),
        isNull(bookings.reminderSentAt),
        gt(bookings.startsAt, now),
        lte(bookings.startsAt, until),
        lte(bookings.createdAt, sql`${bookings.startsAt} - ${sql.raw(`interval '${REMINDER_HOURS} hours'`)}`),
        withSms ? undefined : and(isNotNull(customers.email), ne(customers.email, "")),
      ),
    );
  const rows = await d
    .update(bookings)
    .set({ reminderSentAt: now })
    .where(and(inArray(bookings.id, due), isNull(bookings.reminderSentAt)))
    .returning({ id: bookings.id });
  return rows.map((r) => r.id);
}

/**
 * Sends the due client reminders: by email when the client left one, otherwise
 * by SMS (when SMS is on). Returns how many were sent (or logged, without a
 * provider).
 */
export async function sendDueReminders(origin: string, now = new Date(), withSms = smsEnabled()): Promise<number> {
  const rows = await bookingDetails(await claimDueReminders(now, withSms));
  let sent = 0;
  for (const { booking, business, service, staff: person, customer } of rows) {
    const locale: Locale = booking.locale ?? "me";
    const t = DICTS[locale];
    const tz = business.timezone;
    if (!customer.email) {
      // Short, so it fits in one or two SMS
      const ok = await sendSms({
        to: customer.phone,
        text: t.notify.smsReminder
          .replace("{business}", business.name)
          .replace("{service}", service.name)
          .replace("{when}", whenShort(booking.startsAt, tz, t, locale, now))
          .replace("{link}", `${origin}/booking/${booking.publicToken}`),
      });
      if (ok || !smsEnabled()) sent++;
      else await (await db()).update(bookings).set({ reminderSentAt: null }).where(eq(bookings.id, booking.id));
      continue;
    }
    const ok = await sendEmail({
      to: customer.email,
      subject: `${t.notify.reminder}: ${service.name} ${whenShort(booking.startsAt, tz, t, locale, now)} · ${business.name}`,
      text: `${t.notify.reminderBody}\n\n${business.name}\n${service.name} · ${person.name}\n${whenLong(booking.startsAt, tz, t, locale)}\n${[business.address, business.city].filter(Boolean).join(", ")}\n\n${t.notify.reminderCancel}\n${origin}/booking/${booking.publicToken}\n`,
    });
    if (ok || !emailEnabled()) sent++;
    // The provider refused it: unmark, so the next run tries again
    else await (await db()).update(bookings).set({ reminderSentAt: null }).where(eq(bookings.id, booking.id));
  }
  return sent;
}
