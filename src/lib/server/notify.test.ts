// Which bookings get a client reminder, against a real (in-memory) Postgres.
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ db: null as unknown }));
vi.mock("@/lib/server/db", () => ({ db: async () => state.db }));

const { claimDueReminders, sendDueReminders } = await import("./notify");

const HOUR = 3_600_000;
const now = new Date("2026-11-02T10:00:00Z");
let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
let base: { businessId: string; staffId: string; serviceId: string };
let withEmail: schema.Customer;
let noEmail: schema.Customer;

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
  await db.delete(schema.services);
  await db.delete(schema.staff);
  await db.delete(schema.businesses);
  await db.delete(schema.users);

  const [owner] = await db.insert(schema.users).values({ email: "owner@test.me" }).returning();
  const [business] = await db.insert(schema.businesses).values({ ownerId: owner.id, name: "Test", slug: "test", type: "nails" }).returning();
  const [ana] = await db.insert(schema.staff).values({ businessId: business.id, name: "Ana" }).returning();
  const [gel] = await db.insert(schema.services).values({ businessId: business.id, name: "Gel", durationMinutes: 60 }).returning();
  base = { businessId: business.id, staffId: ana.id, serviceId: gel.id };
  [withEmail, noEmail] = await db
    .insert(schema.customers)
    .values([
      { businessId: business.id, name: "Ana", phone: "+38267000001", email: "ana@test.me" },
      { businessId: business.id, name: "Ivo", phone: "+38267000002" },
    ])
    .returning();
});

/** A booking `hours` from now, made `ahead` hours before it starts (two days by default). */
async function booking(hours: number, over: Partial<typeof schema.bookings.$inferInsert> & { ahead?: number } = {}) {
  const { ahead = 48, ...rest } = over;
  const startsAt = new Date(now.getTime() + hours * HOUR);
  const [row] = await db
    .insert(schema.bookings)
    .values({
      ...base,
      customerId: withEmail.id,
      startsAt,
      endsAt: new Date(startsAt.getTime() + HOUR),
      createdAt: new Date(startsAt.getTime() - ahead * HOUR),
      publicToken: crypto.randomUUID(),
      ...rest,
    })
    .returning();
  return row.id;
}

describe("claimDueReminders", () => {
  it("picks confirmed bookings starting within the next 24 hours", async () => {
    const soon = await booking(2);
    const tomorrow = await booking(23.5);
    await booking(25);
    await booking(-1);
    expect((await claimDueReminders(now)).sort()).toEqual([soon, tomorrow].sort());
  });

  it("claims each booking only once", async () => {
    const id = await booking(20);
    expect(await claimDueReminders(now)).toEqual([id]);
    expect(await claimDueReminders(now)).toEqual([]);
    expect(await claimDueReminders(new Date(now.getTime() + HOUR))).toEqual([]);
  });

  it("gives one claim to two runs at once", async () => {
    await booking(20);
    const [a, b] = await Promise.all([claimDueReminders(now), claimDueReminders(now)]);
    expect(a.length + b.length).toBe(1);
  });

  it("skips cancelled bookings and other statuses", async () => {
    await booking(20, { status: "cancelled", cancelledAt: now });
    await booking(21, { status: "no_show" });
    expect(await claimDueReminders(now)).toEqual([]);
  });

  it("skips clients without an email when SMS is off", async () => {
    await booking(20, { customerId: noEmail.id });
    expect(await claimDueReminders(now, false)).toEqual([]);
  });

  it("includes clients without an email when SMS is on", async () => {
    const id = await booking(20, { customerId: noEmail.id });
    expect(await claimDueReminders(now, true)).toEqual([id]);
  });

  it("skips bookings made less than a day ahead", async () => {
    await booking(5, { ahead: 6 });
    expect(await claimDueReminders(now)).toEqual([]);
  });
});

describe("sendDueReminders", () => {
  it("sends due reminders once (logged without an email provider)", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const token = "tok-123";
    await booking(20, { publicToken: token, locale: "en" });
    expect(await sendDueReminders("https://termin.test", now)).toBe(1);
    expect(await sendDueReminders("https://termin.test", now)).toBe(0);
    expect(log).toHaveBeenCalledTimes(1);
    const text = String(log.mock.calls[0][0]);
    expect(text).toContain("to=ana@test.me");
    expect(text).toContain("Reminder: Gel tomorrow 07:00 · Test");
    expect(text).toContain("https://termin.test/booking/tok-123");
    log.mockRestore();
  });

  it("texts clients without an email when SMS is on (logged without an SMS provider)", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await booking(20, { customerId: noEmail.id, publicToken: "tok-sms" });
    expect(await sendDueReminders("https://termin.test", now, true)).toBe(1);
    expect(log).toHaveBeenCalledTimes(1);
    const text = String(log.mock.calls[0][0]);
    expect(text).toContain("[sms] to=+38267000002");
    expect(text).toContain("Test: podsjetnik – Gel, sjutra 07:00");
    expect(text).toContain("https://termin.test/booking/tok-sms");
    log.mockRestore();
  });
});
