import { eq } from "drizzle-orm";
import { businesses } from "@/db/schema";
import { getSlots } from "@/lib/server/booking";
import { db } from "@/lib/server/db";
import { isDateKey } from "@/lib/time";

const UUID = /^[0-9a-f-]{36}$/i;

// GET /api/slots?b=<slug>&s=<serviceId>&st=<staffId|any>&d=YYYY-MM-DD
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const slug = params.get("b") ?? "";
  const serviceId = params.get("s") ?? "";
  const staffParam = params.get("st") ?? "any";
  const date = params.get("d") ?? "";
  if (!slug || !UUID.test(serviceId) || !isDateKey(date) || (staffParam !== "any" && !UUID.test(staffParam))) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const d = await db();
  const business = await d.query.businesses.findFirst({ where: eq(businesses.slug, slug) });
  if (!business) return Response.json({ error: "not_found" }, { status: 404 });
  const slots = await getSlots(business, serviceId, staffParam === "any" ? null : staffParam, date);
  return Response.json({ slots }, { headers: { "Cache-Control": "no-store" } });
}
