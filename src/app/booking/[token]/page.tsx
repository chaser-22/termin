import { Suspense } from "react";
import Link from "next/link";
import { getDict } from "@/i18n/server";
import { getBookingByToken } from "@/lib/server/booking";
import { formatDateLong, formatPrice } from "@/lib/format";
import { dateKeyOf, formatTime, isPast } from "@/lib/time";
import { CancelButton } from "./CancelButton";

export default function BookingPage({ params }: PageProps<"/booking/[token]">) {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <Suspense fallback={<div className="h-96 rounded-2xl bg-surface-2 animate-pulse" />}>
        <BookingDetails params={params} />
      </Suspense>
    </main>
  );
}

async function BookingDetails({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { locale, t } = await getDict();
  const data = await getBookingByToken(token);
  if (!data) return <p className="card p-8 text-center text-muted">{t.book.notFound}</p>;
  const { booking, business, service, staff } = data;
  const tz = business.timezone;
  const cancelled = booking.status === "cancelled";
  const past = isPast(booking.startsAt);

  return (
    <div className="card overflow-hidden">
      <div className={`px-6 pt-8 pb-6 text-center ${cancelled ? "" : "bg-accent-soft"}`}>
        <div className={`mx-auto grid place-items-center size-14 rounded-full text-2xl ${cancelled ? "bg-surface-2 text-muted" : "bg-accent text-accent-ink"}`}>
          {cancelled ? "×" : "✓"}
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">{cancelled ? t.booking.cancelledTitle : t.booking.confirmedTitle}</h1>
        <p className="mt-1 text-muted">{business.name}</p>
      </div>

      <dl className="divide-y divide-line border-y border-line text-[15px]">
        <Row label={t.booking.when}>
          <span className={cancelled ? "line-through text-muted" : "font-medium"}>
            {formatDateLong(dateKeyOf(booking.startsAt, tz), t, locale)}, {formatTime(booking.startsAt, tz)}–{formatTime(booking.endsAt, tz)}
          </span>
        </Row>
        <Row label={t.booking.service}>
          {service.name} · {formatPrice(service.priceCents, t.common.priceOnRequest)}
        </Row>
        <Row label={t.booking.staff}>{staff.name}</Row>
        {business.address && (
          <Row label={t.booking.where}>
            {business.address}
            {business.city ? `, ${business.city}` : ""}
          </Row>
        )}
      </dl>

      <div className="p-6 space-y-3">
        {!cancelled && (
          <a href={`/booking/${token}/calendar.ics`} className="btn-primary w-full">
            {t.booking.addToCalendar}
          </a>
        )}
        <div className="grid grid-cols-2 gap-3">
          {business.phone && (
            <a href={`tel:${business.phone.replace(/\s/g, "")}`} className="btn-secondary">
              {t.booking.call}
            </a>
          )}
          <Link href={`/${business.slug}`} className={`btn-secondary ${business.phone ? "" : "col-span-2"}`}>
            {t.booking.bookAgain}
          </Link>
        </div>
        {!cancelled && !past && <CancelButton token={token} label={t.booking.cancelBooking} confirmText={t.booking.cancelConfirm} />}
        {!cancelled && <p className="text-xs text-muted text-center pt-2">{t.booking.saveLink}</p>}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 px-6 py-3.5">
      <dt className="w-16 shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
