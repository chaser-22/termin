import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

// With DATABASE_URL set (production on Vercel + Neon), connect to Postgres.
// Without it (local development), run an embedded Postgres (PGlite) stored in
// .data/pglite, so there is nothing to install. Both speak the same SQL.

async function createPostgres(url: string) {
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const postgres = (await import("postgres")).default;
  // prepare: false keeps it compatible with Neon's pooled (PgBouncer) endpoint
  const client = postgres(url, { prepare: false, max: 5 });
  return drizzle(client, { schema });
}

async function createPglite() {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dataDir = path.join(process.cwd(), ".data", "pglite");
  fs.mkdirSync(path.dirname(dataDir), { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

type PostgresDb = Awaited<ReturnType<typeof createPostgres>>;
export type Db = PostgresDb;

const globalForDb = globalThis as unknown as { __db?: Promise<Db> };

export function getDbClient(): Promise<Db> {
  if (!globalForDb.__db) {
    const url = process.env.DATABASE_URL;
    // Both drivers expose the same query API; the cast unifies their types.
    globalForDb.__db = url ? createPostgres(url) : (createPglite() as unknown as Promise<Db>);
  }
  return globalForDb.__db;
}
