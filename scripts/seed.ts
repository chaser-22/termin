// Adds the demo businesses the homepage links to. Safe to run again: existing
// demos are left alone. Each demo has its own owner (one business per owner).
// Stop the dev server first when using the local database (it allows one process).
import { eq } from "drizzle-orm";
import { getDbClient } from "@/db/client";
import { businesses, staff, users, workingHours, type BusinessType } from "@/db/schema";
import { createBusinessWithDefaults } from "@/lib/server/setup";
import { VERTICALS } from "@/lib/verticals";

type Demo = {
  slug: string;
  name: string;
  type: BusinessType;
  owner: { email: string; name: string };
  city: string;
  address: string;
  phone: string;
  description?: string;
  brandColor?: string;
};

export const DEMOS: Demo[] = [
  {
    slug: "demo-nokti",
    name: "Nail Studio Lena",
    type: "nails",
    owner: { email: "demo-nokti@example.com", name: "Lena" },
    city: "Podgorica",
    address: "Hercegovačka 20",
    phone: "+382 67 300 200",
    description: "Gel lak, manikir i nadogradnja, u mirnom studiju u centru.",
  },
  {
    slug: "marko",
    name: "Berbernica Marko",
    type: "barber",
    owner: { email: "demo@example.com", name: "Marko" },
    city: "Podgorica",
    address: "Njegoševa 12",
    phone: "+382 67 123 456",
  },
  {
    slug: "demo-padel",
    name: "Padel Budva",
    type: "court",
    owner: { email: "demo-padel@example.com", name: "Padel Budva" },
    city: "Budva",
    address: "Jadranski put bb",
    phone: "+382 68 200 300",
    description: "Dva natkrivena padel terena, reketi za iznajmljivanje na recepciji.",
    brandColor: "cobalt",
  },
  {
    slug: "demo-joga",
    name: "Joga Kotor",
    type: "fitness",
    owner: { email: "demo-joga@example.com", name: "Ana" },
    city: "Kotor",
    address: "Stari grad 341",
    phone: "+382 69 400 500",
    description: "Joga i pilates u malim grupama, sa pogledom na zaliv.",
    brandColor: "olive",
  },
  {
    slug: "demo-rent",
    name: "Bike & Kayak Tivat",
    type: "rental",
    owner: { email: "demo-rent@example.com", name: "Tivat Rent" },
    city: "Tivat",
    address: "Porto Montenegro, Obala bb",
    phone: "+382 67 600 700",
    description: "Električni bicikli i kajaci, na sat ili cijeli dan.",
    brandColor: "gold",
  },
  {
    slug: "demo-stomatolog",
    name: "Stomatologija Kotor",
    type: "dentist",
    owner: { email: "demo-stomatolog@example.com", name: "Dr Jelena" },
    city: "Kotor",
    address: "Škaljari bb",
    phone: "+382 69 800 900",
    description: "Pregledi, popravke i čišćenje kamenca. Hitni slučajevi istog dana.",
    brandColor: "cobalt",
  },
  {
    slug: "demo-masaza",
    name: "Wellness Budva",
    type: "massage",
    owner: { email: "demo-masaza@example.com", name: "Wellness Budva" },
    city: "Budva",
    address: "Mediteranska 8",
    phone: "+382 68 300 400",
    description: "Relax i sportska masaža, tretmani za parove.",
    brandColor: "olive",
  },
];

async function main() {
  const db = await getDbClient();
  for (const demo of DEMOS) {
    const existing = await db.query.businesses.findFirst({ where: eq(businesses.slug, demo.slug) });
    // Each demo wears its industry page's accent, so the page and its example match
    const accent = VERTICALS.find((v) => v.demo === `/${demo.slug}`)?.accent ?? demo.brandColor;
    if (existing) {
      if (accent && existing.brandColor !== accent) await db.update(businesses).set({ brandColor: accent }).where(eq(businesses.id, existing.id));
      console.log(`seed: /${demo.slug} already exists`);
      continue;
    }
    const [user] = await db
      .insert(users)
      .values({ email: demo.owner.email, name: demo.owner.name })
      .onConflictDoUpdate({ target: users.email, set: { name: demo.owner.name } })
      .returning();
    const business = await createBusinessWithDefaults(db, {
      ownerId: user.id,
      ownerName: demo.owner.name,
      name: demo.name,
      slug: demo.slug,
      type: demo.type,
      city: demo.city,
      address: demo.address,
      phone: demo.phone,
      locale: "me",
    });
    if (demo.description || accent) {
      await db
        .update(businesses)
        .set({ description: demo.description ?? null, ...(accent ? { brandColor: accent } : {}) })
        .where(eq(businesses.id, business.id));
    }
    if (demo.slug === "marko") {
      // A second barber: Tue–Sat 10:00–14:00 and 15:00–19:00 (lunch break)
      const [second] = await db.insert(staff).values({ businessId: business.id, name: "Luka", sortOrder: 1 }).returning();
      const rows = [];
      for (let weekday = 2; weekday <= 6; weekday++) {
        rows.push({ staffId: second.id, weekday, startMinute: 600, endMinute: 840 });
        rows.push({ staffId: second.id, weekday, startMinute: 900, endMinute: 1140 });
      }
      await db.insert(workingHours).values(rows);
    }
    if (demo.slug === "demo-rent") {
      // Name the rental items like a real shop
      const items = await db.select().from(staff).where(eq(staff.businessId, business.id));
      const names = ["E-bike 1", "Kajak 1"];
      for (const [i, item] of items.entries()) await db.update(staff).set({ name: names[i] ?? item.name }).where(eq(staff.id, item.id));
    }
    console.log(`seed: created /${demo.slug} (owner ${demo.owner.email})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
