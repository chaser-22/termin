import { eq } from "drizzle-orm";
import { businesses } from "@/db/schema";
import { getSlotsRange } from "@/lib/server/booking";
import { db } from "@/lib/server/db";
import { isDateKey } from "@/lib/time";

const UUID = /^[0-9a-f-]{36}$/i;

// GET /api/slots?b=<slug>&s=<serviceId>&st=<staffId|any>&d=YYYY-MM-DD[&days=14]
// → { days: { "YYYY-MM-DD": [ISO start, …] }, left: { ISO start: places left } } (left only for classes)
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const slug = params.get("b") ?? "";
  const serviceId = params.get("s") ?? "";
  const staffParam = params.get("st") ?? "any";
  const date = params.get("d") ?? "";
  const days = Number(params.get("days") ?? "1");
  if (
    !slug ||
    !UUID.test(serviceId) ||
    !isDateKey(date) ||
    (staffParam !== "any" && !UUID.test(staffParam)) ||
    !Number.isInteger(days) ||
    days < 1 ||
    days > 31
  ) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const d = await db();
  const business = await d.query.businesses.findFirst({ where: eq(businesses.slug, slug) });
  if (!business) return Response.json({ error: "not_found" }, { status: 404 });
  const { days: range, left } = await getSlotsRange(business, serviceId, staffParam === "any" ? null : staffParam, date, days);
  return Response.json({ days: range, left }, { headers: { "Cache-Control": "no-store" } });
}
