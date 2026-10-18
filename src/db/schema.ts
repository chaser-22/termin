import {
  boolean,
  index,
  integer,
  primaryKey,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: createdAt(),
});

// One-time sign-in links. Only a SHA-256 hash of the token is stored.
export const loginTokens = pgTable("login_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const sessions = pgTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

import type { BusinessType } from "@/lib/slug";
export { BUSINESS_TYPES, type BusinessType } from "@/lib/slug";

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").$type<BusinessType>().notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  description: text("description"),
  timezone: text("timezone").notNull().default("Europe/Podgorica"),
  currency: text("currency").notNull().default("EUR"),
  // Key into BRANDS in src/lib/brand.ts
  brandColor: text("brand_color").notNull().default("adriatic"),
  // Booking rules
  slotStepMinutes: integer("slot_step_minutes").notNull().default(15),
  minNoticeMinutes: integer("min_notice_minutes").notNull().default(60),
  maxDaysAhead: integer("max_days_ahead").notNull().default(30),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  createdAt: createdAt(),
});

export const staff = pgTable(
  "staff",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // "person" (barber, therapist) or "resource" (court, room, boat). Both are
    // booked the same way: own hours, own calendar column, one booking at a time.
    kind: text("kind").$type<StaffKind>().notNull().default("person"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("staff_business_idx").on(t.businessId)],
);

export const STAFF_KINDS = ["person", "resource"] as const;
export type StaffKind = (typeof STAFF_KINDS)[number];

// Which people/resources can do a service. A service with no rows here can be
// done by anyone, so businesses that never set this keep working as before.
export const serviceStaff = pgTable(
  "service_staff",
  {
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.serviceId, t.staffId] })],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    // Price in cents; null means "price on request"
    priceCents: integer("price_cents"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("services_business_idx").on(t.businessId)],
);

// Weekly hours per staff member. Several rows on one weekday model a break.
// weekday: 1 = Monday … 7 = Sunday (ISO). Minutes are from local midnight.
export const workingHours = pgTable(
  "working_hours",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
  },
  (t) => [index("working_hours_staff_idx").on(t.staffId)],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("customers_business_phone_idx").on(t.businessId, t.phone)],
);

export const BOOKING_STATUSES = ["confirmed", "cancelled", "no_show", "completed"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const BOOKING_SOURCES = ["online", "walk_in", "phone"] as const;
export type BookingSource = (typeof BOOKING_SOURCES)[number];

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: text("status").$type<BookingStatus>().notNull().default("confirmed"),
    source: text("source").$type<BookingSource>().notNull().default("online"),
    // Secret token in the customer's link to view, cancel or add to calendar
    publicToken: text("public_token").notNull().unique(),
    note: text("note"),
    createdAt: createdAt(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    index("bookings_staff_time_idx").on(t.staffId, t.startsAt),
    index("bookings_business_time_idx").on(t.businessId, t.startsAt),
  ],
);

export type Business = typeof businesses.$inferSelect;
export type Staff = typeof staff.$inferSelect;
export type Service = typeof services.$inferSelect;
export type WorkingHours = typeof workingHours.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
