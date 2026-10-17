import { buildIcs } from "@/lib/ics";
import { getBookingByToken } from "@/lib/server/booking";
import { appOrigin } from "@/lib/server/url";

export async function GET(_request: Request, ctx: RouteContext<"/booking/[token]/calendar.ics">) {
  const { token } = await ctx.params;
  const data = await getBookingByToken(token);
  if (!data) return new Response("Not found", { status: 404 });
  const { booking, business, service, staff } = data;
  const url = `${await appOrigin()}/booking/${token}`;
  const ics = buildIcs({
    uid: `${booking.id}@termin`,
    start: booking.startsAt,
    end: booking.endsAt,
    title: `${service.name} · ${business.name}`,
    description: `${staff.name}\n${business.phone ?? ""}\n${url}`,
    location: [business.address, business.city].filter(Boolean).join(", "),
    url,
    cancelled: booking.status === "cancelled",
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="termin.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
