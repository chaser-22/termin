// Adds a demo barbershop at /marko owned by demo@example.com.
// Stop the dev server first when using the local database (it allows one process).
import { eq } from "drizzle-orm";
import { getDbClient } from "@/db/client";
import { businesses, staff, users, workingHours } from "@/db/schema";
import { createBusinessWithDefaults } from "@/lib/server/setup";

async function main() {
  const db = await getDbClient();
  const existing = await db.query.businesses.findFirst({ where: eq(businesses.slug, "marko") });
  if (existing) {
    console.log("seed: demo business already exists at /marko");
    return;
  }
  const [user] = await db
    .insert(users)
    .values({ email: "demo@example.com", name: "Marko" })
    .onConflictDoUpdate({ target: users.email, set: { name: "Marko" } })
    .returning();
  const business = await createBusinessWithDefaults(db, {
    ownerId: user.id,
    ownerName: "Marko",
    name: "Berbernica Marko",
    slug: "marko",
    type: "barber",
    city: "Podgorica",
    address: "Njegoševa 12",
    phone: "+382 67 123 456",
    locale: "me",
  });
  const [second] = await db.insert(staff).values({ businessId: business.id, name: "Luka", sortOrder: 1 }).returning();
  // Luka: Tue–Sat 10:00–14:00 and 15:00–19:00 (lunch break)
  const rows = [];
  for (let weekday = 2; weekday <= 6; weekday++) {
    rows.push({ staffId: second.id, weekday, startMinute: 600, endMinute: 840 });
    rows.push({ staffId: second.id, weekday, startMinute: 900, endMinute: 1140 });
  }
  await db.insert(workingHours).values(rows);
  console.log("seed: created demo business at /marko (owner demo@example.com)");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
