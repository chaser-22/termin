// Booking rules against a real (in-memory) Postgres, with the app's migrations.
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { addDays, localToInstant, todayKey } from "@/lib/time";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ db: null as unknown }));
vi.mock("@/lib/server/db", () => ({ db: async () => state.db }));

const { createBooking, getSlots, getSlotsRange, firstFreeSlot, cancelByToken } = await import("./booking");

const TZ = "Europe/Podgorica";
let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
let business: schema.Business;
let ana: schema.Staff;
let ivo: schema.Staff;
let haircut: schema.Service;
// A Monday a week or more ahead, so minimum notice never interferes
let monday: string;

beforeAll(async () => {
  client = new PGlite();
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(__dirname, "../../../drizzle") });
  state.db = db;
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await db.delete(schema.bookings);
  await db.delete(schema.customers);
  await db.delete(schema.workingHours);
  await db.delete(schema.services);
  await db.delete(schema.staff);
  await db.delete(schema.businesses);
  await db.delete(schema.users);

  const [owner] = await db.insert(schema.users).values({ email: "owner@test.me" }).returning();
  [business] = await db.insert(schema.businesses).values({ ownerId: owner.id, name: "Test", slug: "test", type: "barber" }).returning();
  [ana, ivo] = await db
    .insert(schema.staff)
    .values([
      { businessId: business.id, name: "Ana", sortOrder: 0 },
      { businessId: business.id, name: "Ivo", sortOrder: 1 },
    ])
    .returning();
  [haircut] = await db.insert(schema.services).values({ businessId: business.id, name: "Cut", durationMinutes: 30 }).returning();
  // Both work Monday 09:00–11:00
  await db.insert(schema.workingHours).values([
    { staffId: ana.id, weekday: 1, startMinute: 540, endMinute: 660 },
    { staffId: ivo.id, weekday: 1, startMinute: 540, endMinute: 660 },
  ]);

  let d = addDays(todayKey(TZ), 7);
  while (new Date(`${d}T12:00:00Z`).getUTCDay() !== 1) d = addDays(d, 1);
  monday = d;
});

const at = (minutes: number) => localToInstant(monday, minutes, TZ);
const book = (over: Partial<Parameters<typeof createBooking>[0]> = {}) =>
  createBooking({
    business,
    serviceId: haircut.id,
    staffId: ana.id,
    startsAt: at(540),
    name: "Klijent",
    phone: "+38267000000",
    source: "online",
    ...over,
  });

describe("createBooking", () => {
  it("books a free slot and hides it from the free times", async () => {
    const res = await book();
    expect(res.ok).toBe(true);
    const free = await getSlots(business, haircut.id, ana.id, monday);
    expect(free).not.toContain(at(540).toISOString());
    expect(free).toContain(at(570).toISOString());
  });

  it("refuses the same staff member at the same time", async () => {
    expect((await book()).ok).toBe(true);
    expect(await book({ phone: "+38267111111" })).toEqual({ ok: false, error: "slot_taken" });
  });

  it("lets only one of two simultaneous requests win", async () => {
    const results = await Promise.all([book(), book({ phone: "+38267111111" })]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
  });

  it("gives 'anyone' to the next free staff member", async () => {
    await book();
    const res = await book({ staffId: null, phone: "+38267111111" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const row = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, res.bookingId) });
    expect(row?.staffId).toBe(ivo.id);
  });

  it("refuses online times outside working hours or off the grid", async () => {
    expect(await book({ startsAt: at(8 * 60) })).toEqual({ ok: false, error: "slot_taken" });
    expect(await book({ startsAt: at(540 + 7) })).toEqual({ ok: false, error: "slot_taken" });
  });

  it("allows a walk-in outside hours but not over another booking", async () => {
    await book();
    expect((await book({ source: "walk_in", startsAt: at(8 * 60) })).ok).toBe(true);
    expect(await book({ source: "walk_in", startsAt: at(540 + 15) })).toEqual({ ok: false, error: "slot_taken" });
  });

  it("refuses dates beyond the booking window", async () => {
    const far = localToInstant(addDays(todayKey(TZ), business.maxDaysAhead + 7), 540, TZ);
    expect(await book({ startsAt: far })).toEqual({ ok: false, error: "invalid" });
  });

  it("refuses a hidden service online", async () => {
    await db.update(schema.services).set({ active: false }).where(eq(schema.services.id, haircut.id));
    expect(await book()).toEqual({ ok: false, error: "invalid" });
  });

  it("refuses a staff member from another business", async () => {
    const [other] = await db.insert(schema.businesses).values({ ownerId: business.ownerId, name: "Other", slug: "other", type: "salon" }).returning();
    const [stranger] = await db.insert(schema.staff).values({ businessId: other.id, name: "X" }).returning();
    expect((await book({ staffId: stranger.id, source: "walk_in" })).ok).toBe(false);
  });

  it("keeps one customer per phone number", async () => {
    await book({ name: "Old name" });
    await book({ name: "New name", startsAt: at(600) });
    const rows = await db.select().from(schema.customers);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("New name");
  });
});

describe("getSlotsRange", () => {
  it("matches the single-day result for every day in the range", async () => {
    await book();
    const from = addDays(monday, -3);
    const range = await getSlotsRange(business, haircut.id, null, from, 7);
    expect(Object.keys(range)).toHaveLength(7);
    for (const [date, slots] of Object.entries(range)) {
      expect(slots).toEqual(await getSlots(business, haircut.id, null, date));
    }
    expect(range[monday]).not.toHaveLength(0);
  });

  it("clips to the booking window", async () => {
    const range = await getSlotsRange(business, haircut.id, null, addDays(todayKey(TZ), -10), 31);
    expect(Object.keys(range).sort()[0]).toBe(todayKey(TZ));
  });

  it("finds the first free time", async () => {
    const first = await firstFreeSlot(business, 14);
    expect(first).not.toBeNull();
    expect(first!.start.getTime()).toBeGreaterThan(Date.now());
    expect(first!.serviceId).toBe(haircut.id);
  });
});

describe("cancelByToken", () => {
  it("cancels once and frees the time", async () => {
    const res = await book();
    if (!res.ok) throw new Error("booking failed");
    expect(await cancelByToken(res.publicToken)).toBe(true);
    expect(await cancelByToken(res.publicToken)).toBe(false);
    expect(await getSlots(business, haircut.id, ana.id, monday)).toContain(at(540).toISOString());
  });

  it("ignores unknown tokens", async () => {
    expect(await cancelByToken("nope")).toBe(false);
  });
});
