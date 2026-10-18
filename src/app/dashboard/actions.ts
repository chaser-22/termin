"use server";

import { and, eq, gt, lt, ne } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BOOKING_STATUSES, BUSINESS_TYPES, bookings, businesses, classTimes, serviceStaff, services, staff, workingHours } from "@/db/schema";
import { getLocale } from "@/i18n/server";
import { requireBusiness, requireUser } from "@/lib/server/auth";
import { createBooking } from "@/lib/server/booking";
import { db } from "@/lib/server/db";
import { createBusinessWithDefaults, isValidSlug } from "@/lib/server/setup";
import { isBrandKey } from "@/lib/brand";
import { normalizePhone } from "@/lib/phone";
import { isDateKey, localToInstant, parseTime } from "@/lib/time";

export type FormState = { ok?: boolean; error?: string } | null;

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const optional = (v: string) => (v === "" ? null : v);

// ---------------------------------------------------------------- setup

export async function setupBusiness(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const d = await db();
  const existing = await d.query.businesses.findFirst({ where: eq(businesses.ownerId, user.id) });
  if (existing) redirect("/dashboard");

  const parsed = z
    .object({
      name: z.string().min(2).max(80),
      slug: z.string(),
      type: z.enum(BUSINESS_TYPES),
      ownerName: z.string().max(60),
      city: z.string().max(60),
    })
    .safeParse({ name: str(fd, "name"), slug: str(fd, "slug").toLowerCase(), type: str(fd, "type"), ownerName: str(fd, "ownerName"), city: str(fd, "city") });
  if (!parsed.success) return { error: "invalid" };
  if (!isValidSlug(parsed.data.slug)) return { error: "slug" };
  const taken = await d.query.businesses.findFirst({ where: eq(businesses.slug, parsed.data.slug) });
  if (taken) return { error: "slugTaken" };

  await createBusinessWithDefaults(d, {
    ownerId: user.id,
    ownerName: parsed.data.ownerName || parsed.data.name,
    name: parsed.data.name,
    slug: parsed.data.slug,
    type: parsed.data.type,
    city: optional(parsed.data.city),
    locale: await getLocale(),
  });
  revalidatePath("/", "layout");
  // The form does a full page load to /dashboard: the browser may hold a copy of
  // /dashboard prefetched before the business existed, which redirects back here.
  return { ok: true };
}

// ---------------------------------------------------------------- bookings

export async function createDashboardBooking(_prev: FormState, fd: FormData): Promise<FormState> {
  const { business } = await requireBusiness();
  const date = str(fd, "date");
  const minutes = parseTime(str(fd, "time"));
  const phone = normalizePhone(str(fd, "phone"));
  const name = str(fd, "name");
  const source = str(fd, "source") === "phone" ? "phone" : "walk_in";
  const ids = z.object({ serviceId: z.uuid(), staffId: z.uuid() }).safeParse({ serviceId: str(fd, "serviceId"), staffId: str(fd, "staffId") });
  if (!ids.success || !isDateKey(date) || minutes === null || name.length < 1) return { error: "invalid" };
  if (!phone) return { error: "phone" };

  const result = await createBooking({
    business,
    serviceId: ids.data.serviceId,
    staffId: ids.data.staffId,
    startsAt: localToInstant(date, minutes, business.timezone),
    name,
    phone,
    note: optional(str(fd, "note")),
    source,
  });
  if (!result.ok) return { error: result.error === "slot_taken" ? "conflict" : "invalid" };
  refresh();
  return { ok: true };
}

export async function setBookingStatus(bookingId: string, status: string): Promise<FormState> {
  const { business } = await requireBusiness();
  const parsed = z.enum(BOOKING_STATUSES).safeParse(status);
  if (!parsed.success) return { error: "invalid" };
  const d = await db();
  const result = await d.transaction(async (tx) => {
    const booking = await tx.query.bookings.findFirst({ where: and(eq(bookings.id, bookingId), eq(bookings.businessId, business.id)) });
    if (!booking) return { error: "invalid" };
    // Un-cancelling takes the time back, so it must still be free
    if (booking.status === "cancelled" && parsed.data !== "cancelled") {
      await tx.select({ id: staff.id }).from(staff).where(eq(staff.id, booking.staffId)).for("update");
      const clash = await tx.query.bookings.findFirst({
        where: and(
          eq(bookings.staffId, booking.staffId),
          ne(bookings.id, booking.id),
          ne(bookings.status, "cancelled"),
          lt(bookings.startsAt, booking.endsAt),
          gt(bookings.endsAt, booking.startsAt),
        ),
      });
      if (clash) return { error: "restoreConflict" };
    }
    await tx
      .update(bookings)
      .set({ status: parsed.data, cancelledAt: parsed.data === "cancelled" ? new Date() : null })
      .where(eq(bookings.id, booking.id));
    return { ok: true };
  });
  if (result.ok) refresh();
  return result;
}

// ---------------------------------------------------------------- services

export async function saveService(fd: FormData) {
  const { business } = await requireBusiness();
  const name = str(fd, "name");
  const duration = Number(str(fd, "duration"));
  const priceRaw = str(fd, "price").replace(",", ".");
  const price = priceRaw === "" ? null : Math.round(Number(priceRaw) * 100);
  const capacityRaw = str(fd, "capacity");
  const capacity = capacityRaw === "" ? 1 : Number(capacityRaw);
  if (!name || !Number.isInteger(duration) || duration < 5 || duration > 600) return;
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) return;
  if (price !== null && (!Number.isFinite(price) || price < 0)) return;

  const d = await db();
  const id = str(fd, "id");
  if (id) {
    await d
      .update(services)
      .set({ name, durationMinutes: duration, priceCents: price, capacity })
      .where(and(eq(services.id, id), eq(services.businessId, business.id)));
  } else {
    const count = await d.$count(services, eq(services.businessId, business.id));
    await d.insert(services).values({ businessId: business.id, name, durationMinutes: duration, priceCents: price, capacity, sortOrder: count });
  }
  refresh();
}

export async function addClassTime(serviceId: string, fd: FormData) {
  const { business } = await requireBusiness();
  const weekday = Number(str(fd, "weekday"));
  const minute = parseTime(str(fd, "time"));
  const staffId = str(fd, "staffId");
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7 || minute === null) return;
  const d = await db();
  const [service, member] = await Promise.all([
    d.query.services.findFirst({ where: and(eq(services.id, serviceId), eq(services.businessId, business.id)) }),
    d.query.staff.findFirst({ where: and(eq(staff.id, staffId), eq(staff.businessId, business.id)) }),
  ]);
  if (!service || !member) return;
  await d.insert(classTimes).values({ serviceId, staffId, weekday, startMinute: minute });
  refresh();
}

export async function removeClassTime(id: string) {
  const { business } = await requireBusiness();
  const d = await db();
  const row = await d
    .select({ id: classTimes.id })
    .from(classTimes)
    .innerJoin(services, eq(services.id, classTimes.serviceId))
    .where(and(eq(classTimes.id, id), eq(services.businessId, business.id)));
  if (row.length) await d.delete(classTimes).where(eq(classTimes.id, id));
  refresh();
}

export async function toggleService(id: string, active: boolean) {
  const { business } = await requireBusiness();
  const d = await db();
  await d.update(services).set({ active }).where(and(eq(services.id, id), eq(services.businessId, business.id)));
  refresh();
}

// ---------------------------------------------------------------- staff

export async function saveStaff(fd: FormData) {
  const { business } = await requireBusiness();
  const name = str(fd, "name");
  if (!name) return;
  const kind = str(fd, "kind") === "resource" ? "resource" : "person";
  const d = await db();
  const id = str(fd, "id");
  if (id) {
    await d.update(staff).set({ name }).where(and(eq(staff.id, id), eq(staff.businessId, business.id)));
  } else {
    const count = await d.$count(staff, eq(staff.businessId, business.id));
    await d.transaction(async (tx) => {
      const [member] = await tx.insert(staff).values({ businessId: business.id, name, kind, sortOrder: count }).returning();
      // Copy the owner's (first staff member's) hours as a starting point
      const first = await tx.query.staff.findFirst({ where: and(eq(staff.businessId, business.id)), orderBy: (s, { asc }) => [asc(s.sortOrder), asc(s.createdAt)] });
      if (first && first.id !== member.id) {
        const hours = await tx.select().from(workingHours).where(eq(workingHours.staffId, first.id));
        if (hours.length) await tx.insert(workingHours).values(hours.map((h) => ({ staffId: member.id, weekday: h.weekday, startMinute: h.startMinute, endMinute: h.endMinute })));
      }
    });
  }
  refresh();
}

/**
 * Turns one person/resource on or off for a service. "No links" means everyone,
 * so the first change starts from everyone, and getting back to everyone clears the links.
 */
export async function setServiceStaff(serviceId: string, staffId: string, enabled: boolean) {
  const { business } = await requireBusiness();
  const d = await db();
  const service = await d.query.services.findFirst({ where: and(eq(services.id, serviceId), eq(services.businessId, business.id)) });
  if (!service) return;
  const all = (await d.select({ id: staff.id }).from(staff).where(and(eq(staff.businessId, business.id), eq(staff.active, true)))).map((r) => r.id);
  if (!all.includes(staffId)) return;
  const links = (await d.select({ id: serviceStaff.staffId }).from(serviceStaff).where(eq(serviceStaff.serviceId, serviceId))).map((r) => r.id);
  const current = new Set(links.length ? links : all);
  if (enabled) current.add(staffId);
  else current.delete(staffId);
  if (current.size === 0) return; // a service must stay bookable by someone
  await d.transaction(async (tx) => {
    await tx.delete(serviceStaff).where(eq(serviceStaff.serviceId, serviceId));
    const everyone = all.every((id) => current.has(id));
    if (!everyone) await tx.insert(serviceStaff).values([...current].map((id) => ({ serviceId, staffId: id })));
  });
  refresh();
}

export async function toggleStaff(id: string, active: boolean) {
  const { business } = await requireBusiness();
  const d = await db();
  await d.update(staff).set({ active }).where(and(eq(staff.id, id), eq(staff.businessId, business.id)));
  refresh();
}

/** Form fields per weekday w (1–7): open-w, from-w, to-w, and optional break bfrom-w / bto-w. */
export async function saveHours(_prev: FormState, fd: FormData): Promise<FormState> {
  const { business } = await requireBusiness();
  const staffId = str(fd, "staffId");
  const d = await db();
  const member = await d.query.staff.findFirst({ where: and(eq(staff.id, staffId), eq(staff.businessId, business.id)) });
  if (!member) return { error: "invalid" };

  const rows: { staffId: string; weekday: number; startMinute: number; endMinute: number }[] = [];
  for (let w = 1; w <= 7; w++) {
    if (fd.get(`open-${w}`) !== "on") continue;
    const from = parseTime(str(fd, `from-${w}`));
    const to = parseTime(str(fd, `to-${w}`));
    if (from === null || to === null || to <= from) return { error: "invalid" };
    const bFrom = parseTime(str(fd, `bfrom-${w}`));
    const bTo = parseTime(str(fd, `bto-${w}`));
    if (bFrom !== null && bTo !== null && bFrom > from && bTo < to && bTo > bFrom) {
      rows.push({ staffId, weekday: w, startMinute: from, endMinute: bFrom });
      rows.push({ staffId, weekday: w, startMinute: bTo, endMinute: to });
    } else {
      rows.push({ staffId, weekday: w, startMinute: from, endMinute: to });
    }
  }
  await d.transaction(async (tx) => {
    await tx.delete(workingHours).where(eq(workingHours.staffId, staffId));
    if (rows.length) await tx.insert(workingHours).values(rows);
  });
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------- settings

export async function saveSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  const { business } = await requireBusiness();
  const slug = str(fd, "slug").toLowerCase();
  if (!isValidSlug(slug)) return { error: "slug" };
  const d = await db();
  if (slug !== business.slug) {
    const taken = await d.query.businesses.findFirst({ where: eq(businesses.slug, slug) });
    if (taken) return { error: "slugTaken" };
  }
  const int = (key: string, min: number, max: number, fallback: number) => {
    const n = Number(str(fd, key));
    return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
  };
  const type = z.enum(BUSINESS_TYPES).safeParse(str(fd, "type"));
  const name = str(fd, "name");
  if (name.length < 2) return { error: "invalid" };

  await d
    .update(businesses)
    .set({
      name,
      slug,
      type: type.success ? type.data : business.type,
      phone: optional(str(fd, "phone")),
      address: optional(str(fd, "address")),
      city: optional(str(fd, "city")),
      description: optional(str(fd, "description").slice(0, 300)),
      minNoticeMinutes: int("minNotice", 0, 7 * 24 * 60, business.minNoticeMinutes),
      maxDaysAhead: int("maxDays", 1, 365, business.maxDaysAhead),
      slotStepMinutes: int("slotStep", 5, 120, business.slotStepMinutes),
      brandColor: isBrandKey(str(fd, "brandColor")) ? str(fd, "brandColor") : business.brandColor,
    })
    .where(eq(businesses.id, business.id));
  refresh();
  return { ok: true };
}
