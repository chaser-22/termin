// Makes a personal invitation link for a business you contacted.
//   npx tsx scripts/invite.ts "Berbernica Marko" barber
// Types: barber, salon, nails, beauty, massage, dentist, clinic, fitness, court, rental, other
// Stop the dev server first when using the local database (it allows one process).
import { randomBytes } from "node:crypto";
import { getDbClient } from "@/db/client";
import { invites } from "@/db/schema";
import { BUSINESS_TYPES, slugify, type BusinessType } from "@/lib/slug";

async function main() {
  const [name, type = "barber"] = process.argv.slice(2);
  if (!name || name.trim().length < 2 || !(BUSINESS_TYPES as readonly string[]).includes(type)) {
    console.error('Usage: npx tsx scripts/invite.ts "Business name" <type>');
    console.error(`Types: ${BUSINESS_TYPES.join(", ")}`);
    process.exit(1);
  }
  // Readable but hard to guess: berbernica-marko-x7k2q9
  const code = `${slugify(name).slice(0, 24).replace(/-+$/, "")}-${randomBytes(4).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6)}`;
  const db = await getDbClient();
  await db.insert(invites).values({ code, businessName: name.trim(), type: type as BusinessType });
  const origin = process.env.APP_URL || "http://localhost:3000";
  console.log(`\n${name.trim()}\n${origin}/p/${code}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
