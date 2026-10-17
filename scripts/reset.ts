// Deletes the local embedded database so it is recreated on next start.
// Stop the dev server first. Run `npm run db:seed` afterwards for demo data.
import fs from "node:fs";
import path from "node:path";

if (process.env.DATABASE_URL) {
  console.error("reset: DATABASE_URL is set; refusing to touch a real database");
  process.exit(1);
}
fs.rmSync(path.join(process.cwd(), ".data", "pglite"), { recursive: true, force: true });
console.log("reset: local database deleted");
