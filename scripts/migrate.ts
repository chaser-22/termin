// Applies migrations in ./drizzle to the database in DATABASE_URL.
// Runs before `next build` on Vercel. Locally (no DATABASE_URL) it does
// nothing, because the embedded database migrates itself on first use.
import path from "node:path";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("migrate: DATABASE_URL not set, skipping (local database migrates on first use)");
    return;
  }
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const postgres = (await import("postgres")).default;
  const client = postgres(url, { prepare: false, max: 1 });
  await migrate(drizzle(client), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await client.end();
  console.log("migrate: done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
