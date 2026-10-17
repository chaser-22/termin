import "server-only";
import { connection } from "next/server";
import { getDbClient } from "@/db/client";

/** The database, for use while handling a request (never during prerendering). */
export async function db() {
  await connection();
  return getDbClient();
}
